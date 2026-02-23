"""
Main module for generating nursing schedules.
This file contains all business logic, staff configuration,
and rotation rules for easy maintenance and modification.
"""

from datetime import date, timedelta
import random

# --- STAFF CONFIGURATION ---

# Generate 80 Nurses
# IDs 1-20: Special Night Rotation (NightRotation)
# IDs 21-80: Standard Day Shift (Day)
NURSES = []
for i in range(1, 81):
    role = "NightRotation" if i <= 20 else "Day"
    NURSES.append({
        "id": i,
        "name": f"Nurse {i}",
        "role": "Nurse",
        "group": role
    })

# Color Configuration
COLORS = {
    "Morning": "#fbbf24", # Amber
    "Afternoon": "#f97316", # Orange
    "Night": "#4f46e5",    # Indigo
}

def generate_schedule(weeks_to_generate=12):
    """
    Generates a shift schedule for 'weeks_to_generate' weeks.
    Returns a list of dictionaries with shift assignments.
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
        month_num = current_day_date.month
        
        # Calculate which "Week of Month" this is roughly (0-3)
        week_in_month = (day_of_month - 1) // 7
        if week_in_month > 3: week_in_month = 3
        
        for nurse in NURSES:
            nid = nurse["id"]
            group = nurse["group"]
            
            # === LOGIC 1: SPECIAL NIGHT ROTATION (20 Nurses) ===
            if group == "NightRotation":
                assigned_week = (nid - 1) // 5 
                is_night_week = (week_in_month == assigned_week)
                
                if is_night_week:
                    is_pattern_a = ((month_num + nid) % 2 == 0)
                    is_scheduled_night = False
                    if is_pattern_a:
                        # 3 Days: Mon(0), Wed(2), Fri(4)
                        if weekday in [0, 2, 4]:
                            is_scheduled_night = True
                    else:
                        # 4 Days: Tue(1), Thu(3), Sat(5), Sun(6)
                        if weekday in [1, 3, 5, 6]:
                            is_scheduled_night = True

                    if is_scheduled_night:
                        schedule.append({
                            "nurse_id": nid,
                            "nurse_name": nurse["name"],
                            "date": current_day_date.isoformat(),
                            "shift": "Night",
                            "color": COLORS["Night"]
                        })
                else:
                    # Non-night weeks: Day shifts (Mon-Fri)
                    if weekday < 5:
                        shift_type = "Morning" if random.random() > 0.5 else "Afternoon"
                        schedule.append({
                            "nurse_id": nid,
                            "nurse_name": nurse["name"],
                            "date": current_day_date.isoformat(),
                            "shift": shift_type,
                            "color": COLORS[shift_type]
                        })

            # === LOGIC 2: REST OF NURSES (60) ===
            else:
                if weekday < 5:
                    shift_type = "Morning" if random.random() > 0.5 else "Afternoon"
                    schedule.append({
                        "nurse_id": nid,
                        "nurse_name": nurse["name"],
                        "date": current_day_date.isoformat(),
                        "shift": shift_type,
                        "color": COLORS[shift_type]
                    })

    return schedule

def getNurses():
    """Returns the list of configured nurses."""
    return NURSES
