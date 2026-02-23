import requests
import json

def analyze_triage_notes(notes, model="biomistral", ollama_url="http://host.docker.internal:11434"):
    """
    Sends clinical notes to Ollama (BioMistral) and returns structured JSON.
    """
    prompt = f"""
    You are an expert triage nurse AI. Analyze the following clinical note and extract:
    1. A list of Symptoms (symptoms).
    2. A suggested Triage Level (Green, Yellow, Orange, Red) based on severity.
    3. A brief Justification (1 sentence).
    4. Suggested Actions (comma-separated).

    Clinical Note: "{notes}"

    Return ONLY a JSON object with keys: "symptoms", "triage_level", "justification", "actions".
    Do not include markdown formatting like ```json.
    """
    
    try:
        payload = {
            "model": model,
            "prompt": prompt,
            "stream": False,
            "format": "json" # Force JSON mode if supported by model version
        }
        
        # Fallback for models that don't support format: json natively
        # We'll just ask nicely in the prompt (already done).
        
        response = requests.post(f"{ollama_url}/api/generate", json=payload, timeout=30)
        response.raise_for_status()
        
        result_text = response.json().get("response", "")
        
        # Clean up potential markdown
        result_text = result_text.replace("```json", "").replace("```", "").strip()
        
        return json.loads(result_text)
        
    except Exception as e:
        print(f"Ollama Error: {e}"); import traceback; traceback.print_exc()
        # Return fallback mock if AI fails (for demo stability)
        return {
            "symptoms": ["Error connecting to AI"],
            "triage_level": "Yellow",
            "justification": "AI service unavailable, defaulting to standard protocol.",
            "actions": "Manual assessment required."
        }
