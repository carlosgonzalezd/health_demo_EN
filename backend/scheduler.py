"""
Módulo principal para la generación de planillas de enfermería.
Este fichero contiene toda la lógica de negocio, configuración de personal
y reglas de rotación para facilitar su mantenimiento y modificación.
"""

from datetime import date, timedelta
import random

# --- CONFIGURACIÓN DE PERSONAL ---

# Generar 80 Enfermeras
# IDs 1-20: Rotación Especial Noche (NightRotation)
# IDs 21-80: Turno Diurno Estándar (Day)
NURSES = []
for i in range(1, 81):
    role = "NightRotation" if i <= 20 else "Day"
    NURSES.append({
        "id": i,
        "name": f"Enfermera {i}",
        "role": "Enfermera",
        "group": role
    })

# Configuración de Colores
COLORS = {
    "Mañana": "#fbbf24", # Amber
    "Tarde": "#f97316",  # Orange
    "Noche": "#4f46e5",  # Indigo
}

def generate_schedule(weeks_to_generate=12):
    """
    Genera una planilla de turnos para 'weeks_to_generate' semanas.
    Retorna una lista de diccionarios con la asignación de turnos.
    """
    today = date.today()
    # Align to the 1st of the current month
    start_date = today.replace(day=1)
    
    schedule = []
    
    # Loop day by day for X weeks * 7 days
    total_days = weeks_to_generate * 7
    
    for day_offset in range(total_days):
        current_day_date = start_date + timedelta(days=day_offset)
        # weekday(): 0=Mon, ... 6=Sun
        weekday = current_day_date.weekday()
        day_of_month = current_day_date.day
        
        # Determine strict "odd/even" month for alternation
        # Using month number (1-12)
        month_num = current_day_date.month
        
        # Calculate which "Week of Month" this is roughly (0-3)
        # Simple approximation: (day - 1) // 7
        # Note: This might result in week 4 (days 29-31). We'll treat week 4 as week 0 of next cycle or just extra days.
        week_in_month = (day_of_month - 1) // 7
        if week_in_month > 3: week_in_month = 3 # Cap at last slot
        
        for nurse in NURSES:
            nid = nurse["id"]
            group = nurse["group"]
            
            # === LOGICA 1: ROTACIÓN ESPECIAL NOCHE (20 Enfermeras) ===
            # Regla: 1 semana al mes de noche.
            # Patrón: Mes 1 (3 días), Mes 2 (4 días alternos).
            if group == "NightRotation":
                # 1. Asignar semana de noche a cada enfermera
                # Repartimos las 20 enfermeras en 4 semanas (5 enfermeras por semana aprox, o por pares)
                # Usamos pares (nid, nid+1) para cubrir la semana completa
                # Pair 1 (1,2) -> Week 0
                # Pair 2 (3,4) -> Week 1 ...
                # Cycles every 4 pairs? No, we have 10 pairs.
                # Let's map ID to a scheduled week:
                # IDs 1-5 -> Week 0
                # IDs 6-10 -> Week 1
                # IDs 11-15 -> Week 2
                # IDs 16-20 -> Week 3
                assigned_week = (nid - 1) // 5 
                
                is_night_week = (week_in_month == assigned_week)
                
                if is_night_week:
                    # Determinar si toca patrón de 3 días o de 4 días
                    # Alternancia mensual. 
                    # Nurse Odd (Impar) starts with 3 days in Odd Months?
                    # Let's define: 
                    #   Pattern A (3 days): Mon, Wed, Fri (L, X, V) -> Indices 0, 2, 4
                    #   Pattern B (4 days): Tue, Thu, Sat, Sun (M, J, S, D) -> Indices 1, 3, 5, 6
                    
                    # Logic:
                    # Generic alternation based on month + nurse parity
                    # (month_num + nid) % 2 == 0  -> Pattern A
                    # else -> Pattern B
                    # This ensures that for the same nurse, it flips every month.
                    # And for nurses with consecutive IDs (1,2), they have opposite patterns in the same month (covering the full week).
                    
                    is_pattern_a = ((month_num + nid) % 2 == 0)
                    
                    is_scheduled_night = False
                    if is_pattern_a:
                        # 3 Días: Lun(0), Mié(2), Vie(4)
                        if weekday in [0, 2, 4]:
                            is_scheduled_night = True
                    else:
                        # 4 Días: Mar(1), Jue(3), Sab(5), Dom(6)
                        if weekday in [1, 3, 5, 6]:
                            is_scheduled_night = True

                    if is_scheduled_night:
                        schedule.append({
                            "nurse_id": nid,
                            "nurse_name": nurse["name"],
                            "date": current_day_date.isoformat(),
                            "shift": "Noche",
                            "color": COLORS["Noche"]
                        })
                    else:
                        # Off days during night week are "Saliente" or "Libre". 
                        # We don't schedule them.
                        pass
                
                else:
                     # Non-night weeks: Work Days (Mon-Fri)
                     # Standard day shift
                    if weekday < 5:
                        shift_type = "Mañana" if random.random() > 0.5 else "Tarde"
                        schedule.append({
                            "nurse_id": nid,
                            "nurse_name": nurse["name"],
                            "date": current_day_date.isoformat(),
                            "shift": shift_type,
                            "color": COLORS[shift_type]
                        })

            # === LOGICA 2: RESTO DE ENFERMERAS (60) ===
            else:
                # Turno diurno estándar (L-V)
                if weekday < 5:
                    shift_type = "Mañana" if random.random() > 0.5 else "Tarde"
                    schedule.append({
                        "nurse_id": nid,
                        "nurse_name": nurse["name"],
                        "date": current_day_date.isoformat(),
                        "shift": shift_type,
                        "color": COLORS[shift_type]
                    })

    return schedule

def getNurses():
    """Retorna la lista de enfermeras configuradas."""
    return NURSES
