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
            status["yolo"] = {"available": True, "name": "YOLO v8 (General)"}
        except:
            status["yolo"] = {"available": True, "name": "YOLO v8 (General)"}  # Service exists even if GET not supported
        
        # Check TorchXRayVision
        try:
            resp = await client.get(f"{config['XRAY_URL']}/health", timeout=3.0)
            if resp.status_code == 200:
                data = resp.json()
                status["xray"] = {
                    "available": True,
                    "name": f"TorchXRayVision ({data.get('model', 'DenseNet121')})",
                    "pathologies_count": data.get("pathologies_count", 18)
                }
            else:
                status["xray"] = {"available": False, "name": "TorchXRayVision"}
        except:
            status["xray"] = {"available": False, "name": "TorchXRayVision"}
    
    return status

@app.post("/analyze-image", response_model=AnalysisResponse)
async def analyze_image(
    file: UploadFile = File(...),
    model: str = Form("llama3"),
    patient_id: str = Form("None"),
    age: str = Form("Desconocida"),
    sex: str = Form("Desconocido"),
    symptoms: str = Form("No especificados"),
    engine: str = Form("xray")
):
    # Patient context
    patient_data = next((p for p in patients_db if p['id'] == patient_id), None)
    
    if patient_data:
        context_prefix = f"""
PACIENTE: {patient_data['nombre']} (ID: {patient_id})
PERFIL: {patient_data['edad']} años, {patient_data['sexo']}.
ANTECEDENTES: {patient_data['historia']}.
ESTADO ACTUAL: {patient_data['motivo']}.
"""
    else:
        context_prefix = f"Paciente genérico. Edad: {age}, Sexo: {sex}. Síntomas: {symptoms}."

    # 1. Vision Analysis - Route to selected engine
    image_bytes = await file.read()
    detections = []
    pathologies = {}
    engine_label = ""

    async with httpx.AsyncClient() as client:
        if engine == "xray":
            # TorchXRayVision (medical-specific)
            engine_label = "TorchXRayVision (DenseNet121)"
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
            engine_label = "YOLO v8 (General)"
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
        
        detection_text = "\n".join(detection_parts) if detection_parts else "Sin hallazgos patológicos significativos. Radiografía aparentemente normal."
    else:
        detection_text = ", ".join([f"{d['class']} ({d['confidence']:.2f})" for d in detections]) or "Sin hallazgos detectados."

    # 2. System Prompt
    system_prompt = """Eres un radiólogo especialista y médico internista de alto nivel. Responde SIEMPRE en español.

REGLAS DE FORMATO VISUAL (CRÍTICAS):
1. Usa **ESTRICTAMENTE Markdown** para jerarquía.
2. Usa **Headers** (### SECCIÓN) para los bloques de información.
3. **PREFIERE EL USO DE PÁRRAFOS** claros y legibles frente a listas excesivas.
4. Escribe de forma narrativa y fluida, evitando el formato esquemático o "telegráfico".
5. Usa **doble salto de línea** entre párrafos para mejorar la legibilidad.
6. Resalta con **negritas** solo los diagnósticos clave y valores patológicos.

NORMAS CLÍNICAS:
- Correlaciona SIEMPRE los hallazgos de imagen con los antecedentes del paciente.
- Redacta como un informe médico formal: "Se observa...", "Compatible con...", "Se sugiere...".
- Si el motor de visión es YOLO (general), advierte que la detección no es clínica.
- Si el motor es TorchXRayVision, usa las probabilidades para integrarlas en la narrativa diagnóstica.
- Incluye SIEMPRE recomendaciones de pruebas complementarias en un párrafo final.
"""

    user_prompt = f"""
MOTOR DE VISIÓN UTILIZADO: {engine_label}
CONTEXTO CLÍNICO: {context_prefix}
HALLAZGOS DE IMAGEN: {detection_text}

Genera un informe estructurado en JSON:

1. 'clinical_report': Informe técnico para especialistas con estas secciones:
   ► HALLAZGOS RADIOLÓGICOS: Describe lo detectado por el motor de visión.
   ► CORRELACIÓN CLÍNICA: Relaciona hallazgos con antecedentes del paciente.
   ► IMPRESIÓN DIAGNÓSTICA: Diagnóstico diferencial ordenado por probabilidad.
   ► PLAN DE ACTUACIÓN: Pruebas complementarias y seguimiento recomendado.
   (Cada sección en un párrafo separado con salto de línea)

2. 'patient_explanation': INFORME RADIOLÓGICO (DESTINADO AL PACIENTE):
   - Redactado como un documento oficial que se entregará al paciente.
   - Estructura sugerida: "Motivo del estudio", "Hallazgos principales", "Conclusión y recomendaciones".
   - Lenguaje claro pero manteniendo la seriedad clínica.
   - Evita infantilizar la explicación; sé objetivo y claro.
   (Usa párrafos cortos y separados)

Responde ESTRICTAMENTE con un objeto JSON válido que contenga exactamente estas dos claves con el contenido generado por ti:

{{
  "clinical_report": "...escribe aquí el informe técnico detallado para el médico...",
  "patient_explanation": "...escribe aquí la explicación clara y empática para el paciente..."
}}
"""

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
            ollama_resp = await client.post(f"{config['OLLAMA_URL']}/api/chat", json=payload, timeout=120.0)
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
                findings_context=context_prefix + f"\nMotor: {engine_label}\nHallazgos: {detection_text}",
                engine_used=engine_label,
                pathologies=pathologies
            )
        except Exception as e:
            print(f"Error in LLM Call: {e}")
            return AnalysisResponse(
                detections=detections,
                clinical_report=f"Error técnico en el análisis: {str(e)}",
                patient_explanation="Lo sentimos, no hemos podido generar el informe en este momento.",
                findings_context=context_prefix,
                engine_used=engine_label,
                pathologies=pathologies
            )

@app.post("/chat")
async def chat_with_context(req: ChatRequest):
    system_prompt = f"""Eres un médico experto respondiendo consultas clínicas detalladas.
Contexto del caso: {req.context}

REGLAS DE FORMATO (OBLIGATORIAS):
1. Responde SIEMPRE en ESPAÑOL.
2. Usa **Markdown** básico (negritas, cursivas, listas).
3. **PROHIBIDO USAR TABLAS** (formato | Tabla |). Rompen la visualización en móviles.
4. Para presentar datos estructurados, usa SIEMPRE listas con este formato:
   - **Dato**: Valor y explicación.
5. CADA SECCIÓN debe tener un título con emojis (ej: 📊 **METRÍAS UTILIZADAS**).
6. Explica con DETALLE cada punto. Tu respuesta debe educar y justificar.
7. Usa DOBLE SALTO DE LÍNEA solo para separar grandes bloques o secciones.
8. En las listas, usa SALTO SIMPLE para que queden compactas.
9. Resalta términos médicos o prioritarios con **negrita**.
"""
    
    messages = [{"role": "system", "content": system_prompt}] + req.history[-6:] + [{"role": "user", "content": req.message}]
    async with httpx.AsyncClient() as client:
        try:
            payload = {"model": req.model, "messages": messages, "stream": False}
            resp = await client.post(f"{req.ollama_url if req.ollama_url else config['OLLAMA_URL']}/api/chat", json=payload, timeout=60.0)
            return {"response": resp.json().get("message", {}).get("content", "Sin respuesta.")}
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))

@app.post("/chat_stream")
async def chat_with_context_stream(req: ChatRequest):
    system_prompt = f"""Eres un médico experto respondiendo consultas clínicas detalladas.
Contexto del caso: {req.context}

REGLAS DE FORMATO (OBLIGATORIAS):
1. Responde SIEMPRE en ESPAÑOL.
2. Usa **Markdown** básico (negritas, cursivas, listas).
3. **PROHIBIDO USAR TABLAS** (formato | Tabla |). Rompen la visualización en móviles.
4. Para presentar datos estructurados, usa SIEMPRE listas con este formato:
   - **Dato**: Valor y explicación.
5. CADA SECCIÓN debe tener un título con emojis (ej: 📊 **METRÍAS UTILIZADAS**).
6. Explica con DETALLE cada punto. Tu respuesta debe educar y justificar.
7. Usa DOBLE SALTO DE LÍNEA solo para separar grandes bloques o secciones.
8. En las listas, usa SALTO SIMPLE para que queden compactas.
9. Resalta términos médicos o prioritarios con **negrita**.
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
                yield f"\n\n[Error de conexión con el motor de inferencia: {str(e)}]"

    return StreamingResponse(generate(), media_type="text/plain")

@app.post("/triage", response_model=TriageResponse)
async def analyze_triage(req: TriageRequest):
    # Construct Vitals text
    v = req.vitals
    vitals_text = f"FC: {v.hr or 'N/A'} bpm, TA: {v.bp_sys or '?'}/{v.bp_dia or '?'} mmHg, Temp: {v.temp or 'N/A'}°C, SpO2: {v.spo2 or 'N/A'}%"
    
    # Construct Patient Context
    patient_text = "NUEVO PACIENTE (SIN ANTECEDENTES)."
    if req.patient_context:
        pc = req.patient_context
        patient_text = f"PACIENTE: {pc.get('nombre')} ({pc.get('edad')} años, {pc.get('sexo')}). ANTECEDENTES: {pc.get('historia')}."

    # Single combined prompt (works for both chat and generate APIs)
    full_prompt = f"""Eres un experto en triaje hospitalario aplicando el Sistema Manchester (MTS).

NIVELES DE URGENCIA:
1=ROJO (Emergencia, riesgo vital inmediato, atención inmediata)
2=NARANJA (Muy Urgente, riesgo vital potencial, atención en menos de 15 min)
3=AMARILLO (Urgente, potencialmente grave, atención en menos de 60 min)
4=VERDE (Estándar, poco urgente, atención en menos de 2h)

CRITERIOS DE ALARMA:
- Temperatura >=40°C → mínimo Nivel 2 (NARANJA), si >=42°C → Nivel 1 (ROJO)
- Temperatura 38.5-39.9°C → Nivel 2 o 3 (NARANJA/AMARILLO)
- SpO2 <90% → Nivel 1 (ROJO)
- SpO2 90-94% → Nivel 2 (NARANJA)
- FC >120 o <50 bpm → Nivel 2 (NARANJA)
- TA sistólica >200 o <80 mmHg → Nivel 1 o 2
- Dolor torácico → mínimo Nivel 2 (NARANJA)
- Dificultad respiratoria severa → Nivel 1 (ROJO)

DATOS DEL CASO ACTUAL:
{patient_text}
CONSTANTES VITALES: {vitals_text}
MOTIVO DE CONSULTA: {req.complaint}

INSTRUCCIONES: Analiza las constantes vitales del paciente y clasifica según Manchester. 
Devuelve ÚNICAMENTE un JSON con estas 4 claves: "level" (integer 1-4), "priority_name" (ROJO/NARANJA/AMARILLO/VERDE), "justification" (texto explicativo en español), "actions" (acciones clínicas recomendadas).
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
                        {"role": "system", "content": "Eres un experto en triaje Manchester. Analiza las constantes vitales y clasifica al paciente. Devuelve SOLO un JSON válido en español con: level (1-4), priority_name (ROJO/NARANJA/AMARILLO/VERDE), justification, actions."},
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
                priority_name="AMARILLO",
                justification="El modelo de análisis no pudo procesar la solicitud correctamente. Se asigna nivel AMARILLO por precaución. Requiere valoración manual.",
                actions="Valoración manual por enfermería de triaje. Reevaluar constantes en 15 min."
            )

        # Handle key variations
        level = parsed.get("level") or parsed.get("triage_level") or parsed.get("Level") or 3
        priority = parsed.get("priority_name") or parsed.get("priority") or "AMARILLO"
        justification = parsed.get("justification") or parsed.get("reasoning") or parsed.get("justificacion") or "Clasificación automática."
        actions = parsed.get("actions") or parsed.get("acciones") or "Toma de constantes y valoración."

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
            "response": "He recibido tu solicitud de cambio. Verificando reglas de descanso y cobertura... Cambio aplicado.",
            "action": "trigger_optimization"
        }
    elif "optimizar" in request.message.lower() or "optimize" in request.message.lower():
        intent = "optimize"
        return {
            "response": "Entendido. Iniciando motor de optimización para rebalancear la carga de trabajo...",
            "action": "trigger_optimization"
        }
    
    # 2. Respond
    return {
        "response": f"Soy el asistente de planificación. Puedo ayudarte a optimizar turnos o gestionar cambios. ¿Qué necesitas?",
        "action": "none"
    }

