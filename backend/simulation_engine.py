import random

def simulate_mri_analysis(patient_id):
    """
    Simulates a high-fidelity Brain MRI analysis report.
    """
    findings = [
        "Masa hipointensa en región frontal izquierda con edema vasogénico asociado.",
        "Sin evidencia de hemorragia aguda o infarto territorial.",
        "Sistema ventricular de tamaño y morfología normal.",
        "Desviación de la línea media de 3mm hacia la derecha."
    ]
    
    return {
        "ai_model": "NeuroSeg-v4 (High-Res MRI)",
        "pignostic_probability": {
            "Glioblastoma": 0.88,
            "Astrocitoma": 0.12,
            "Absceso Cerebral": 0.05
        },
        "clinical_report": f"ESTUDIO: RM de Cráneo con contraste\n\nHallazgos:\n- {findings[0]}\n- {findings[1]}\n- {findings[2]}\n- {findings[3]}\n\nImpresión:\nSugerente de lesión neoplásica primaria. Se recomienda biopsia estereotáxica.",
        "findings": findings[0]
    }

def simulate_ct_analysis(patient_id):
    """
    Simulates a high-fidelity Abdominal CT analysis report.
    """
    findings = [
        "Hígado de tamaño normal con lesión focal de 2.4cm en segmento IVb.",
        "Vesícula biliar sin litiasis.",
        "Riñones con quiste simple de 1cm en polo superior derecho.",
        "No se observa líquido libre en cavidad abdominal."
    ]
    
    return {
        "ai_model": "HepatoScan AI (Multiphase CT)",
        "pignostic_probability": {
            "Hemangioma": 0.92,
            "Hepatocarcinoma": 0.04,
            "Metástasis": 0.04
        },
        "clinical_report": f"ESTUDIO: TC Abdomen y Pelvis\n\nHallazgos:\n- {findings[0]}\n- {findings[1]}\n- {findings[2]}\n- {findings[3]}\n\nImpresión:\nHemangioma hepático típico. Quiste renal Bosniak I. Hallazgos benignos.",
        "findings": findings[0]
    }
