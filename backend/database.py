import json
import os

DATA_FILE = "hospital_data.json"
PATIENTS_FILE = "patients.json"

class HospitalDB:
    def __init__(self):
        self.data = self._load(DATA_FILE)
        self.patients = self._load(PATIENTS_FILE)

    def _load(self, path):
        if not os.path.exists(path):
            return {} if "history" in path else []
        with open(path, 'r') as f:
            return json.load(f)

    def get_doctors(self):
        return self.data.get("doctors", [])

    def get_appointments(self):
        return self.data.get("appointments", [])

    def get_patient_history(self, patient_id):
        return self.data.get("patient_history", {}).get(patient_id, [])

    def get_all_patients(self):
        return self.patients

db = HospitalDB()
