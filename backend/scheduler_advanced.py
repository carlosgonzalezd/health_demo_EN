from ortools.sat.python import cp_model
from datetime import date, timedelta
import random

def solve_schedule_advanced(nurses, start_date, weeks=4, constraints=[]):
    """
    Solves the nurse scheduling problem using Google OR-Tools CP-SAT solver.
    """
    num_nurses = len(nurses)
    num_days = weeks * 7
    num_shifts = 3  # 0: Morning, 1: Afternoon, 2: Night (3: Off/None implicitly handled)

    all_nurses = range(num_nurses)
    all_days = range(num_days)
    all_shifts = range(num_shifts)

    model = cp_model.CpModel()

    # shifts[(n, d, s)]: nurse n works shift s on day d
    shifts = {}
    for n in all_nurses:
        for d in all_days:
            for s in all_shifts:
                shifts[(n, d, s)] = model.NewBoolVar(f'shift_n{n}_d{d}_s{s}')

    # --- HARD CONSTRAINTS ---

    # 1. Each shift is assigned to exactly one nurse per "role" group (simplified: min coverage)
    # Ensuring at least 2 nurses per shift for safety
    for d in all_days:
        for s in all_shifts:
            model.Add(sum(shifts[(n, d, s)] for n in all_nurses) >= 2)

    # 2. Each nurse works at most one shift per day
    for n in all_nurses:
        for d in all_days:
            model.Add(sum(shifts[(n, d, s)] for s in all_shifts) <= 1)

    # --- SOFT CONSTRAINTS / REQUESTS ---
    
    # Process user prompt constraints (e.g., "Nurse Ana off on Friday")
    # This is a placeholder for the NLP parsing logic integration
    for constraint in constraints:
        # Example: {'nurse_id': 1, 'date': '2023-10-27', 'type': 'OFF'}
        pass 

    # --- SOLVER ---
    solver = cp_model.CpSolver()
    solver.Parameters.linearization_level = 0
    # Search for optimal solution
    status = solver.Solve(model)

    if status == cp_model.OPTIMAL or status == cp_model.FEASIBLE:
        schedule_data = []
        for d in all_days:
            current_day = start_date + timedelta(days=d)
            for n in all_nurses:
                nurse = nurses[n]
                # Check which shift (if any)
                for s in all_shifts:
                    if solver.BooleanValue(shifts[(n, d, s)]):
                        shift_name = ["Mañana", "Tarde", "Noche"][s]
                        color = ["#fbbf24", "#f97316", "#4f46e5"][s]
                        schedule_data.append({
                            "nurse_id": nurse["id"],
                            "nurse_name": nurse["name"],
                            "date": current_day.isoformat(),
                            "shift": shift_name,
                            "color": color
                        })
        return schedule_data
    else:
        return [] # No solution found
