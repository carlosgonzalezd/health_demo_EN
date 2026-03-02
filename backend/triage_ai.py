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
        
        # Robust JSON extraction
        def extract_json_local(text):
            text = text.strip()
            # Try direct
            try: return json.loads(text)
            except: pass
            # Try markdown cleanup
            import re
            clean = re.sub(r'^```(?:json)?\s*', '', text)
            clean = re.sub(r'\s*```$', '', clean)
            try: return json.loads(clean)
            except: pass
            # Try find { }
            try:
                match = re.search(r'\{.*\}', text, re.DOTALL)
                if match: return json.loads(match.group())
            except: pass
            return {}

        return extract_json_local(result_text)
        
    except Exception as e:
        print(f"Ollama Error: {e}"); import traceback; traceback.print_exc()
        # Return fallback mock if AI fails (for demo stability)
        return {
            "symptoms": ["Error connecting to AI"],
            "triage_level": "Yellow",
            "justification": "AI service unavailable, defaulting to standard protocol.",
            "actions": "Manual assessment required."
        }
