import json
import subprocess
import os

def translate_entry(entry):
    prompt = f"""Translate this JSON medical patient entry into French.
Return ONLY the JSON. No explanation.
RULES:
1. id: keep NHC-xxxxx
2. name: keep name
3. age: keep number
4. sex: "Male" -> "Homme", "Female" -> "Femme"
5. history: translate to professional French
6. reason: translate to professional French

ENTRY:
{json.dumps(entry)}
"""
    try:
        # Use gpt-oss:20b as in the other script
        process = subprocess.Popen(['ollama', 'run', 'gpt-oss:20b', prompt], 
                                   stdout=subprocess.PIPE, 
                                   stderr=subprocess.PIPE,
                                   text=True)
        stdout, stderr = process.communicate()
        if process.returncode != 0:
            return None
        
        # Clean up response
        res = stdout.strip()
        if '```' in res:
            res = res.split('```')[1].strip()
            if res.startswith('json'): res = res[4:].strip()
        
        return json.loads(res)
    except Exception as e:
        print(f"Error: {e}")
        return None

def main():
    target_path = "../health_demo_1.0_FR/backend/patients.json"
    with open(target_path, 'r') as f:
        data = json.load(f)
    
    print(f"Translating {len(data)} entries...")
    translated_data = []
    
    # Let's do first 100 for time efficiency
    limit = 100
    for i, entry in enumerate(data[:limit]):
        print(f"[{i+1}/{limit}] {entry['name']}...")
        trans = translate_entry(entry)
        if trans:
            translated_data.append(trans)
        else:
            translated_data.append(entry)
            
    # Add the rest untranslated just in case
    translated_data.extend(data[limit:])
    
    with open(target_path, 'w') as f:
        json.dump(translated_data, f, indent=2, ensure_ascii=False)
    print("Done.")

if __name__ == "__main__":
    main()
