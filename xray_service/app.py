from flask import Flask, request, jsonify
import torchxrayvision as xrv
import torchvision.transforms as transforms
import torch
import numpy as np
from PIL import Image
import io
import skimage.io

app = Flask(__name__)

# Load pre-trained DenseNet121 model (all datasets)
print("Loading TorchXRayVision DenseNet121 model...")
model = xrv.models.get_model(weights="densenet121-res224-all")
model.eval()
print(f"Model loaded. Pathologies: {model.pathologies}")

# Spanish translations for pathologies
PATHOLOGY_ES = {
    "Atelectasis": "Atelectasia",
    "Consolidation": "Consolidación",
    "Infiltration": "Infiltrado",
    "Pneumothorax": "Neumotórax",
    "Edema": "Edema Pulmonar",
    "Emphysema": "Enfisema",
    "Fibrosis": "Fibrosis",
    "Effusion": "Derrame Pleural",
    "Pneumonia": "Neumonía",
    "Pleural_Thickening": "Engrosamiento Pleural",
    "Cardiomegaly": "Cardiomegalia",
    "Nodule": "Nódulo Pulmonar",
    "Mass": "Masa Pulmonar",
    "Hernia": "Hernia Diafragmática",
    "Lung Lesion": "Lesión Pulmonar",
    "Fracture": "Fractura",
    "Lung Opacity": "Opacidad Pulmonar",
    "Enlarged Cardiomediastinum": "Mediastino Ensanchado"
}

@app.route('/detect', methods=['POST'])
def detect():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    try:
        # Read image
        img_bytes = file.read()
        img = skimage.io.imread(io.BytesIO(img_bytes))

        # Normalize to [-1024, 1024] range as expected by torchxrayvision
        img = xrv.datasets.normalize(img, 255)

        # Handle color channels
        if len(img.shape) > 2:
            img = img[:, :, 0]  # Take first channel (grayscale)
        if len(img.shape) < 2:
            return jsonify({"error": "Invalid image dimensions"}), 400

        # Add channel dimension [1, H, W]
        img = img[None, :, :]

        # Apply center crop transform
        transform = transforms.Compose([xrv.datasets.XRayCenterCrop()])
        img = transform(img)

        # Convert to tensor and add batch dimension [1, 1, H, W]
        img_tensor = torch.from_numpy(img).unsqueeze(0)

        # Inference
        with torch.no_grad():
            output = model(img_tensor)

        # Get probabilities
        probs = torch.sigmoid(output).cpu().numpy()[0]

        # Build pathology results
        pathologies = {}
        detections = []
        
        # --- ANATOMICAL VALIDATION (Heuristic) ---
        # If the image is extremely off-center or has strange intensity distribution 
        # for a chest X-ray, we should flag it. 
        # DenseNet121-res224-all results can be noisy if the input isn't a chest.
        
        # A simple check: if the model predicts very high probabilities for 
        # "Enlarged Cardiomediastinum" and "Cardiomegaly" on a small joint, 
        # it's usually because it's mapping the joint structure to heart shapes.
        
        probable_chest = True
        # If the mean of the normalized image is very different from typical chest X-rays
        # or if the distribution is too uniform (like a background)
        if np.std(img) < 0.1: # Very low contrast, probably not a valid X-ray
            probable_chest = False

        for i, pathology_name in enumerate(model.pathologies):
            prob = float(probs[i])
            pathologies[pathology_name] = round(prob, 4)

            # Only include significant findings (> 0.3 threshold)
            if prob > 0.3:
                es_name = PATHOLOGY_ES.get(pathology_name, pathology_name)
                detections.append({
                    "class": f"{es_name} ({pathology_name})",
                    "confidence": prob,
                    "bbox": []
                })

        # Sort detections by confidence descending
        detections.sort(key=lambda x: x['confidence'], reverse=True)

        # Logic to detect "Anatomy Mismatch"
        # If the top findings are structural and the clinical LLM should handle the rejection
        # but we can add a flag here.
        anatomy_status = "chest_xray" if probable_chest else "unknown_anatomy"

        return jsonify({
            "detections": detections,
            "pathologies": pathologies,
            "engine": "torchxrayvision",
            "model": "DenseNet121-res224-all",
            "anatomy_status": anatomy_status
        })

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "ok",
        "engine": "TorchXRayVision",
        "model": "DenseNet121-res224-all",
        "pathologies_count": len(model.pathologies),
        "pathologies": list(model.pathologies)
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
