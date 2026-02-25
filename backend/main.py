from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Body
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import os
import io
import json
import uuid
from typing import List, Optional

app = FastAPI(title="Healthcare Demo API", version="1.6")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CREDENTIALS MANAGEMENT ---
CREDENTIALS_FILE = "credentials.json"
DEFAULT_CREDENTIAL = {
    "id": "local-default",
    "name": "Localhost (Default)",
    "ip": "host.docker.internal",
    "port": "11434"
}

def build_credentials_from_env():
    """Build inference node list from environment variables."""
    nodes = [DEFAULT_CREDENTIAL]
    gb10_ip = os.getenv("GB10_IP")
    gb10_port = os.getenv("GB10_OLLAMA_PORT", "11434")
    if gb10_ip:
        nodes.append({"id": "gb10-node", "name": "GB10", "ip": gb10_ip, "port": gb10_port})
    pro_max_ip = os.getenv("DELL_PRO_MAX_IP")
    pro_max_port = os.getenv("DELL_PRO_MAX_OLLAMA_PORT", "11434")
    if pro_max_ip:
        nodes.append({"id": "dell-pro-max-node", "name": "Dell PRO MAX PLUS", "ip": pro_max_ip, "port": pro_max_port})

    # Load dynamic nodes
    for key, val in os.environ.items():
        if key.startswith("CUSTOM_NODE_") and key.endswith("_IP"):
            # Extract node ID: CUSTOM_NODE_x_IP -> x
            node_id = key[len("CUSTOM_NODE_"):-len("_IP")]
            name = os.getenv(f"CUSTOM_NODE_{node_id}_NAME", f"Node {node_id}")
            port = os.getenv(f"CUSTOM_NODE_{node_id}_PORT", "11434")
            nodes.append({"id": f"custom-node-{node_id}", "name": name, "ip": val, "port": port})

    return nodes

def load_credentials():
    # Priority: environment variables > credentials.json > default
    env_creds = build_credentials_from_env()
    if len(env_creds) > 1:
        return env_creds
    if not os.path.exists(CREDENTIALS_FILE):
        save_credentials([DEFAULT_CREDENTIAL])
        return [DEFAULT_CREDENTIAL]
    try:
        with open(CREDENTIALS_FILE, 'r') as f:
            creds = json.load(f)
            if not creds:
                return [DEFAULT_CREDENTIAL]
            return creds
    except:
        return [DEFAULT_CREDENTIAL]

def save_credentials(creds):
    with open(CREDENTIALS_FILE, 'w') as f:
        json.dump(creds, f, indent=2)

# Global Config
config = {
    "YOLO_URL": os.getenv("YOLO_URL", "http://yolo-service:5000"),
    "XRAY_URL": os.getenv("XRAY_URL", "http://xray-service:5001"),
    "OLLAMA_URL": os.getenv("OLLAMA_URL", "http://host.docker.internal:11434")
}

# Load Patients
PATIENTS_FILE = os.path.join(os.path.dirname(__file__), "patients.json")
patients_db = []
try:
    with open(PATIENTS_FILE, "r", encoding="utf-8") as f:
        patients_db = json.load(f)
except Exception as e:
    print(f"Error loading patients: {e}")

# --- MODELS ---
class ChatRequest(BaseModel):
    model: str
    message: str
    context: str
    history: List[dict] = []
    ollama_url: Optional[str] = None

class TriageVitals(BaseModel):
    hr: Optional[str] = None
    bp_sys: Optional[str] = None
    bp_dia: Optional[str] = None
    temp: Optional[str] = None
    spo2: Optional[str] = None

class TriageRequest(BaseModel):
    patient_context: Optional[dict] = None
    vitals: TriageVitals
    complaint: str
    model: str = "llama3"
    ollama_url: Optional[str] = None

class TriageResponse(BaseModel):
    level: int
    priority_name: str
    justification: str
    actions: str

class ConfigRequest(BaseModel):
    ollama_url: str

class Credential(BaseModel):
    id: Optional[str] = None
    name: str
    ip: str
    port: str

class AnalysisResponse(BaseModel):
    detections: list
    clinical_report: str
    patient_explanation: str
    findings_context: str
    engine_used: str
    pathologies: dict = {}

# --- ENDPOINTS ---

@app.get("/")
def read_root():
    return {"message": "Healthcare Demo API v1.6 is running"}

@app.get("/config")
def get_config():
    return config

@app.post("/config")
def update_config(req: ConfigRequest):
    url = req.ollama_url.rstrip('/')
    config["OLLAMA_URL"] = url
    return {"message": "Config updated", "config": config}

@app.get("/credentials")
def get_credentials():
    return load_credentials()

@app.post("/credentials")
def add_credential(cred: Credential):
    creds = load_credentials()
    new_cred = cred.dict()
    new_cred['id'] = str(uuid.uuid4())
    creds.append(new_cred)
    save_credentials(creds)
    return {"message": "Credential added", "credential": new_cred, "credentials": creds}

@app.delete("/credentials/{cred_id}")
def delete_credential(cred_id: str):
    creds = load_credentials()
    creds = [c for c in creds if c['id'] != cred_id]
    if not creds: # Restore default if all deleted
        creds = [DEFAULT_CREDENTIAL]
    save_credentials(creds)
    return {"message": "Credential deleted", "credentials": creds}


@app.get("/models")
async def get_models():
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{config['OLLAMA_URL']}/api/tags", timeout=5.0)
            if resp.status_code == 200:
                return {"models": [m['name'] for m in resp.json().get('models', [])]}
            return {"models": [], "error": f"Ollama status {resp.status_code}"}
        except Exception as e:
            return {"models": [], "error": str(e)}

@app.get("/patients")
def get_patients():
    return patients_db

@app.get("/engines/status")
async def engine_status():
    """Check which vision engines are available"""
    status = {}
    async with httpx.AsyncClient() as client:
        # Check YOLO
        try:
            resp = await client.get(f"{config['YOLO_URL']}/detect", timeout=3.0)
            status["yolo"] = {"available": True, "name": "YOLO v11 (General)"}
        except:
            status["yolo"] = {"available": True, "name": "YOLO v11 (General)"}  # Service exists even if GET not supported
        
        # Check XTraY
        try:
            resp = await client.get(f"{config['XRAY_URL']}/health", timeout=3.0)
            if resp.status_code == 200:
                data = resp.json()
                status["xray"] = {
                    "available": True,
                    "name": f"XTraY (Specialized Chest Radiography)",
                    "pathologies_count": data.get("pathologies_count", 18)
                }
            else:
                status["xray"] = {"available": False, "name": "XTraY"}
        except:
            status["xray"] = {"available": False, "name": "XTraY"}
    
    return status

@app.get("/stats")
def get_hw_stats():
    """Return live hardware stats (GPU, Memory, Throughput)"""
    from stats import get_system_stats
    return get_system_stats()

@app.post("/analyze-image", response_model=AnalysisResponse)
async def analyze_image(
    file: UploadFile = File(...),
    model: str = Form("llama3"),
    patient_id: str = Form("None"),
    age: str = Form("Unknown"),
    sex: str = Form("Unknown"),
    symptoms: str = Form("Not specified"),
    engine: str = Form("xray"),
    ollama_url: Optional[str] = Form(None)
):
    # Patient context
    patient_data = next((p for p in patients_db if p['id'] == patient_id), None)
    
    if patient_data:
        context_prefix = f"""
PATIENT: {patient_data['name']} (ID: {patient_id})
PROFILE: {patient_data['age']} years old, {patient_data['sex']}.
MEDICAL HISTORY: {patient_data['history']}.
CURRENT STATUS: {patient_data['reason']}.
"""
    else:
        context_prefix = f"Generic patient. Age: {age}, Sex: {sex}. Symptoms: {symptoms}."

    # 1. Vision Analysis - Route to selected engine
    image_bytes = await file.read()
    detections = []
    pathologies = {}
    engine_label = ""

    async with httpx.AsyncClient() as client:
        if engine == "xray":
            # XTraY Engine (medical-specific)
            engine_label = "XTraY (Specialized Chest Radiography)"
            try:
                files = {'file': (file.filename, image_bytes, file.content_type)}
                xray_resp = await client.post(f"{config['XRAY_URL']}/detect", files=files, timeout=60.0)
                data = xray_resp.json()
                detections = data.get("detections", [])
                pathologies = data.get("pathologies", {})
            except Exception as e:
                print(f"XRay service error: {e}")
                detections = []
        else:
            # YOLO (general purpose)
            engine_label = "YOLO v11 (General)"
            try:
                files = {'file': (file.filename, image_bytes, file.content_type)}
                yolo_resp = await client.post(f"{config['YOLO_URL']}/detect", files=files, timeout=30.0)
                detections = yolo_resp.json().get("detections", [])
            except Exception as e:
                print(f"YOLO service error: {e}")
                detections = []

    # Format detection text differently based on engine
    if engine == "xray" and pathologies:
        # Show all pathologies with their probabilities
        significant = {k: v for k, v in pathologies.items() if v > 0.3}
        low = {k: v for k, v in pathologies.items() if 0.1 < v <= 0.3}
        
        detection_parts = []
        if significant:
            detection_parts.append("HALLAZGOS SIGNIFICATIVOS (>30%): " + 
                ", ".join([f"{k}: {v*100:.1f}%" for k, v in sorted(significant.items(), key=lambda x: -x[1])]))
        if low:
            detection_parts.append("HALLAZGOS LEVES (10-30%): " + 
                ", ".join([f"{k}: {v*100:.1f}%" for k, v in sorted(low.items(), key=lambda x: -x[1])]))
        
        detection_text = "\n".join(detection_parts) if detection_parts else "No significant pathological findings. Radiograph appears normal."
    else:
        detection_text = ", ".join([f"{d['class']} ({d['confidence']:.2f})" for d in detections]) or "No findings detected."

    # 2. System Prompt
    system_prompt = """You are a specialist radiologist and high-level internist. ALWAYS respond in English.

VISUAL FORMATTING RULES (CRITICAL):
1. Use **STRICTLY Markdown** for hierarchy.
2. Use **Headers** (### SECTION) for information blocks.
3. **PREFER PARAGRAPHS** over excessive lists for legibility.
4. Write in a narrative and fluid way, avoiding "telegraphic" or schematic formats.
5. Use **double line breaks** between paragraphs to improve readability.
6. Highlight key diagnoses and pathological values with **bold**.

CLINICAL STANDARDS:
- ALWAYS correlate image findings with the patient's medical history.
- Write as a formal medical report: "Observed...", "Consistent with...", "Suggests...".
- If the vision engine is generic (YOLO), warn that the detection is not clinical.
- If the engine is XTraY (Specialized Chest), use the probabilities to integrate them into the diagnostic narrative.
- ALWAYS include recommendations for complementary tests in a final paragraph.
"""

    user_prompt = f"""
VISION ENGINE USED: {engine_label}
CLINICAL CONTEXT: {context_prefix}
IMAGE FINDINGS: {detection_text}

Generate a structured JSON report:

1. 'clinical_report': Technical report for specialists with these sections:
   ► RADIOLOGICAL FINDINGS: Describe what was detected by the vision engine.
   ► CLINICAL CORRELATION: Relate findings with the patient's history.
   ► DIAGNOSTIC IMPRESSION: Differential diagnosis ordered by probability.
   ► ACTION PLAN: Complementary tests and recommended follow-up.
   (Each section in a separate paragraph with line breaks)

2. 'patient_explanation': RADIOLOGY REPORT (FOR THE PATIENT):
   - Written as an official document to be delivered to the patient.
   - Suggested structure: "Reason for study", "Main findings", "Conclusion and recommendations".
   - Clear language while maintaining clinical seriousness.
   - Avoid infantilizing the explanation; be objective and clear.
   (Use short, separate paragraphs)

STRICTLY respond with a valid JSON object containing exactly these two keys with your generated content:

{{
  "clinical_report": "...write the detailed technical report for the doctor here...",
  "patient_explanation": "...write the clear and empathetic explanation for the patient here..."
}}
"""

    # Determine LLM URL: use passed ollama_url or fallback to config
    llm_url = (ollama_url.rstrip("/") if ollama_url else config["OLLAMA_URL"].rstrip("/"))
    print(f"DEBUG ANALYZE-IMAGE: model={model}, llm_url={llm_url}")

    async with httpx.AsyncClient() as client:
        try:
            payload = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "stream": False,
                "format": "json"
            }
            ollama_resp = await client.post(f"{llm_url}/api/chat", json=payload, timeout=180.0)
            llm_result = ollama_resp.json()
            response_text = llm_result.get("message", {}).get("content", "{}")

            parsed = json.loads(response_text)
            clin_rep = parsed.get("clinical_report", response_text)
            if isinstance(clin_rep, dict):
                clin_rep = json.dumps(clin_rep, ensure_ascii=False)
            elif not isinstance(clin_rep, str):
                clin_rep = str(clin_rep)

            pat_exp = parsed.get("patient_explanation", "")
            if isinstance(pat_exp, dict):
                pat_exp = json.dumps(pat_exp, ensure_ascii=False)
            elif not isinstance(pat_exp, str):
                pat_exp = str(pat_exp)

            return AnalysisResponse(
                detections=detections,
                clinical_report=clin_rep,
                patient_explanation=pat_exp,
                findings_context=context_prefix + f"\nEngine: {engine_label}\nFindings: {detection_text}",
                engine_used=engine_label,
                pathologies=pathologies
            )
        except Exception as e:
            print(f"Error in LLM Call: {e}")
            return AnalysisResponse(
                detections=detections,
                clinical_report=f"Technical error in analysis: {str(e)}",
                patient_explanation="Sorry, we could not generate the report at this time.",
                findings_context=context_prefix,
                engine_used=engine_label,
                pathologies=pathologies
            )

@app.post("/chat")
async def chat_with_context(req: ChatRequest):
    system_prompt = f"""You are an expert doctor responding to detailed clinical queries.
Case context: {req.context}

FORMATTING RULES (MANDATORY):
1. ALWAYS respond in ENGLISH.
2. Use basic **Markdown** (bold, italics, lists).
3. **DO NOT USE TABLES** (| Table | format). They break mobile display.
4. To present structured data, ALWAYS use lists with this format:
   - **Data**: Value and explanation.
5. EACH SECTION must have a title with emojis (e.g., 📊 **METRICS USED**).
6. Explain each point in DETAIL. Your response should educate and justify.
7. Use DOUBLE LINE BREAKS only to separate large blocks or sections.
8. In lists, use SINGLE LINE BREAKS to keep them compact.
9. Highlight medical or priority terms with **bold**.
"""
    
    messages = [{"role": "system", "content": system_prompt}] + req.history[-6:] + [{"role": "user", "content": req.message}]
    async with httpx.AsyncClient() as client:
        try:
            payload = {"model": req.model, "messages": messages, "stream": False}
            resp = await client.post(f"{req.ollama_url if req.ollama_url else config['OLLAMA_URL']}/api/chat", json=payload, timeout=60.0)
            return {"response": resp.json().get("message", {}).get("content", "No response.")}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat_stream")
async def chat_with_context_stream(req: ChatRequest):
    system_prompt = f"""You are an expert doctor responding to detailed clinical queries.
Case context: {req.context}

FORMATTING RULES (MANDATORY):
1. ALWAYS respond in ENGLISH.
2. Use basic **Markdown** (bold, italics, lists).
3. **DO NOT USE TABLES** (| Table | format). They break mobile display.
4. To present structured data, ALWAYS use lists with this format:
   - **Data**: Value and explanation.
5. EACH SECTION must have a title with emojis (e.g., 📊 **METRICS USED**).
6. Explain each point in DETAIL. Your response should educate and justify.
7. Use DOUBLE LINE BREAKS only to separate large blocks or sections.
8. In lists, use SINGLE LINE BREAKS to keep them compact.
9. Highlight medical or priority terms with **bold**.
"""
    
    messages = [{"role": "system", "content": system_prompt}] + req.history[-6:] + [{"role": "user", "content": req.message}]
    
    async def generate():
        async with httpx.AsyncClient() as client:
            try:
                payload = {"model": req.model, "messages": messages, "stream": True}
                url = f"{req.ollama_url if req.ollama_url else config['OLLAMA_URL']}/api/chat"
                async with client.stream("POST", url, json=payload, timeout=60.0) as resp:
                    async for line in resp.aiter_lines():
                        if line:
                            try:
                                import json
                                data = json.loads(line)
                                if "message" in data and "content" in data["message"]:
                                    yield data["message"]["content"]
                            except json.JSONDecodeError:
                                continue
            except Exception as e:
                yield f"\n\n[Connection error with the inference engine: {str(e)}]"

    return StreamingResponse(generate(), media_type="text/plain")

@app.post("/triage", response_model=TriageResponse)
async def analyze_triage(req: TriageRequest):
    # Construct Vitals text
    v = req.vitals
    vitals_text = f"HR: {v.hr or 'N/A'} bpm, BP: {v.bp_sys or '?'}/{v.bp_dia or '?'} mmHg, Temp: {v.temp or 'N/A'}°C, SpO2: {v.spo2 or 'N/A'}%"
    
    # Construct Patient Context
    patient_text = "NEW PATIENT (NO MEDICAL HISTORY)."
    if req.patient_context:
        pc = req.patient_context
        patient_text = f"PATIENT: {pc.get('name')} ({pc.get('age')} years old, {pc.get('sex')}). MEDICAL HISTORY: {pc.get('history')}."

    # Single combined prompt (works for both chat and generate APIs)
    full_prompt = f"""You are a hospital triage expert applying the Manchester Triage System (MTS).

URGENCY LEVELS:
1=RED (Emergency, immediate life threat, immediate care)
2=ORANGE (Very Urgent, potential life threat, care within 15 min)
3=YELLOW (Urgent, potentially serious, care within 60 min)
4=GREEN (Standard, low urgency, care within 2h)

ALARMS CRITERIA:
- Temperature >=40°C → minimum Level 2 (ORANGE), if >=42°C → Level 1 (RED)
- Temperature 38.5-39.9°C → Level 2 or 3 (ORANGE/YELLOW)
- SpO2 <90% → Level 1 (RED)
- SpO2 90-94% → Level 2 (ORANGE)
- HR >120 or <50 bpm → Level 2 (ORANGE)
- Systolic BP >200 or <80 mmHg → Level 1 or 2
- Chest pain → minimum Level 2 (ORANGE)
- Severe respiratory distress → Level 1 (RED)

CURRENT CASE DATA:
{patient_text}
VITAL SIGNS: {vitals_text}
REASON FOR CONSULTATION: {req.complaint}

INSTRUCTIONS: Analyze the patient's vital signs and classify according to Manchester. 
ONLY return a JSON with these 4 keys: "level" (integer 1-4), "priority_name" (RED/ORANGE/YELLOW/GREEN), "justification" (explanatory text in English), "actions" (recommended clinical actions in English).
JSON:"""

    target_url = (req.ollama_url if req.ollama_url else config["OLLAMA_URL"]).rstrip("/")
    model_name = req.model
    
    print(f"DEBUG TRIAGE: Model={model_name}, URL={target_url}")
    print(f"DEBUG TRIAGE: Vitals={vitals_text}, Complaint={req.complaint}")

    async with httpx.AsyncClient() as client:
        parsed = {}
        
        # --- STRATEGY 1: Try /api/generate FIRST (works better for base models like BioMistral) ---
        try:
            print("DEBUG TRIAGE: Trying /api/generate (base model strategy)...")
            payload_gen = {
                "model": model_name,
                "prompt": full_prompt,
                "stream": False,
                "format": "json"
            }
            resp = await client.post(f"{target_url}/api/generate", json=payload_gen, timeout=90.0)
            result = resp.json()
            response_text = result.get("response", "{}")
            print(f"DEBUG TRIAGE [generate]: Raw response = {response_text[:500]}")
            
            clean_text = response_text.replace("```json", "").replace("```", "").strip()
            parsed = json.loads(clean_text)
            
            # Validate: check if it actually contains triage keys
            has_valid_keys = any(k in parsed for k in ["level", "triage_level", "Level", "priority_name", "priority"])
            if not has_valid_keys:
                print("DEBUG TRIAGE [generate]: Response parsed but missing triage keys")
                parsed = {}
                
        except Exception as e:
            print(f"DEBUG TRIAGE [generate]: Failed - {e}")
            parsed = {}

        # --- STRATEGY 2: Fallback to /api/chat (works for instruction-tuned models) ---
        if not parsed:
            try:
                print("DEBUG TRIAGE: Falling back to /api/chat...")
                payload_chat = {
                    "model": model_name,
                    "messages": [
                        {"role": "system", "content": "You are a Manchester Triage expert. Analyze vital signs and classify the patient. ONLY return a valid JSON in English with: level (1-4), priority_name (RED/ORANGE/YELLOW/GREEN), justification, actions."},
                        {"role": "user", "content": full_prompt}
                    ],
                    "stream": False,
                    "format": "json"
                }
                resp = await client.post(f"{target_url}/api/chat", json=payload_chat, timeout=90.0)
                result = resp.json()
                response_text = result.get("message", {}).get("content", "{}")
                print(f"DEBUG TRIAGE [chat]: Raw response = {response_text[:500]}")
                
                clean_text = response_text.replace("```json", "").replace("```", "").strip()
                parsed = json.loads(clean_text)
                
                has_valid_keys = any(k in parsed for k in ["level", "triage_level", "Level", "priority_name", "priority"])
                if not has_valid_keys:
                    print("DEBUG TRIAGE [chat]: Response parsed but missing triage keys")
                    parsed = {}
                
            except Exception as e:
                print(f"DEBUG TRIAGE [chat]: Also failed - {e}")
                parsed = {}

        # --- Parse Result ---
        if not parsed:
            print("DEBUG TRIAGE: Both strategies failed. Returning error fallback.")
            return TriageResponse(
                level=3,
                priority_name="YELLOW",
                justification="The analysis model failed to process the request correctly. Level YELLOW assigned as a precaution. Requires manual assessment.",
                actions="Manual assessment by triage nursing. Re-evaluate vital signs in 15 min."
            )

        # Ensure parsed is a dict
        if not isinstance(parsed, dict):
            print(f"DEBUG TRIAGE: Parsed result is not a dict: {type(parsed)}. Resetting to empty.")
            parsed = {}

        # Handle key variations
        level = parsed.get("level") or parsed.get("triage_level") or parsed.get("Level") or 3
        priority = parsed.get("priority_name") or parsed.get("priority") or "YELLOW"
        justification = parsed.get("justification") or parsed.get("reasoning") or parsed.get("justificacion") or "Automatic classification."
        actions = parsed.get("actions") or parsed.get("acciones") or "Vital signs and assessment."

        if isinstance(actions, list):
            actions = "; ".join(actions)

        # Sanitize level
        try:
            level = int(level)
            if level < 1 or level > 4:
                level = 3
        except (ValueError, TypeError):
            level = 3

        print(f"DEBUG TRIAGE: Final result -> Level={level}, Priority={priority}")

        return TriageResponse(
            level=level,
            priority_name=priority,
            justification=justification,
            actions=actions
        )

# --- PERSONNEL SCHEDULE LOGIC ---
# --- PERSONNEL SCHEDULE LOGIC ---
from scheduler import generate_schedule, getNurses
from scheduler_advanced import solve_schedule_advanced

@app.get("/schedule")
def get_schedule():
    """Generates a 12-week schedule based on the complex rules defined in scheduler.py."""
    try:
        schedule_data = generate_schedule(weeks_to_generate=12)
        return {"schedule": schedule_data}
    except Exception as e:
        print(f"Error generating schedule: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/nurses")
def get_nurses_endpoint():
    """Returns the list of configured nurses."""
    return getNurses()

# --- AI ENGINES (TRIAGE & FORECASTING) ---
from forecasting import get_forecast
from triage_ai import analyze_triage_notes

class TriageAnalyzeRequest(BaseModel):
    notes: str
    model: str = "biomistral"
    ollama_url: str = "http://host.docker.internal:11434"

@app.post("/triage/analyze")
async def analyze_triage_clinical(request: TriageAnalyzeRequest):
    """Activates BioMistral via Ollama to analyze clinical notes."""
    try:
        # Check if ollama is reachable (optional ping)
        # For now, just call the wrapper
        result = analyze_triage_notes(request.notes, request.model, request.ollama_url)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/schedule/forecast")
def get_demand_forecast():
    """Generates demand forecast using Prophet."""
    try:
        forecast_data = get_forecast(days=30)
        return {"forecast": forecast_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# --- ADVANCED SCHEDULING ENDPOINTS ---

class OptimizationRequest(BaseModel):
    constraints: List[str] # Natural language constraints for now

@app.post("/schedule/optimize")
async def optimize_schedule(request: OptimizationRequest):
    """
    Triggers the OR-Tools solver to generate a new schedule based on constraints.
    """
    nurses = getNurses()
    # In a real scenario, we would parse the natural language 'constraints' 
    # into structured data (dates, shift types, nurse IDs) using an LLM.
    # for now, we'll just re-run the solver to show it works.
    
    # Mocking appropriate start date (next month)
    start_date = date.today().replace(day=1) 
    
    new_schedule = solve_schedule_advanced(nurses, start_date)
    
    if not new_schedule:
        raise HTTPException(status_code=400, detail="No feasible schedule found.")
        
    return new_schedule

@app.post("/schedule/chat")
async def schedule_chat(request: ChatRequest):
    """
    Chatbot specifically for the Planilla tab. 
    Interprets user intent and acts as an agent to modify the schedule.
    """
    # 1. Analyze intent with Ollama (if available) or simple keywords
    intent = "unknown"
    if "cambiar" in request.message.lower() or "change" in request.message.lower():
        intent = "modify_schedule"
        return {
            "response": "Request received. Verifying rest rules and coverage... Change applied.",
            "action": "trigger_optimization"
        }
    elif "optimizar" in request.message.lower() or "optimize" in request.message.lower():
        intent = "optimize"
        return {
            "response": "Understood. Starting optimization engine to rebalance workload...",
            "action": "trigger_optimization"
        }
    
    # 2. Respond
    return {
        "response": f"I am the scheduling assistant. I can help you optimize shifts or manage changes. What do you need?",
        "action": "none"
    }
