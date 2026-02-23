from flask import Flask, request, jsonify
from ultralytics import YOLO
import io
from PIL import Image
import numpy as np

app = Flask(__name__)

# Load model (will download on first run if not present)
model = YOLO("yolov8n.pt") 

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
        img = Image.open(io.BytesIO(img_bytes))
        
        # Inference
        results = model(img)
        
        detections = []
        for result in results:
            for box in result.boxes:
                # box.xyxy is a tensor, convert to list
                bbox = box.xyxy[0].tolist() 
                conf = float(box.conf[0])
                cls = int(box.cls[0])
                name = model.names[cls]
                
                detections.append({
                    "class": name,
                    "confidence": conf,
                    "bbox": bbox
                })
        
        return jsonify({"detections": detections})
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
