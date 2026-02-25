# HealthOS Project Evolution

This document tracks the different versions, architectural changes, and key feature updates of the HealthOS ecosystem.

## 1. Project Foundations

### **Version 1.0 (Standard)**
*   **Path**: `/home/gb10demo/carlos/projects/health_demo`
*   **Purpose**: Initial Medical AI Proof of Concept.
*   **Stack**: FastAPI, React (Vite), Vanilla CSS.
*   **Core Systems**:
    *   **Vision Engine**: XTraY (specialized engine for Chest Radiography).
    *   **Object Detection**: YOLOv11 for general object identification.
    *   **Triage**: Initial logic for patient classification.
    *   **Scheduling**: Baseline shift management for nurses.

---

## 2. Professional Implementation

### **Version 3.1 (Masterpiece / Pro)**
*   **Path**: `/home/gb10demo/carlos/projects/health_demo_v2`
*   **Theme**: "Pro Mode" with high-contrast UI, metric cards, and "Monitor Central" dashboard.
*   **Architectural Shifts**:
    *   **Modularization**: Introduced `frontend/src/components/` (Dashboard, PatientDetail, StudyViewer, Triage, NurseCalendar).
    *   **Enhanced Backend**: Multi-strategy triage (Chain-of-Thought reasoning + Conversation).
    *   **Scalability**: Expanded to 80 nurses with advanced OR-Tools scheduling logic (Night Rotation patterns).

### **Key Improvements in V3.1**:
- **BioMistral Failsafe (v1.6)**: 
    - Problem: BioMistral models often return NLU training artifacts (e.g., `genie2017`, `intent_slots`) instead of clinical reports.
    - Solution: Implemented an automatic backend fallback to `gpt-oss:20b` if artifacts are detected.
- **Dynamic Port Mapping**: Frontends now dynamically detect the backend port (4200 vs 4201) based on the browser URL, allowing parallel deployments.
- **Consecutive Scheduling**: Fixed gaps in the 12-week shift calendar to ensure a continuous clinical timeline.

---

## 3. Next Generation (In Progress)

### **Version 3.2.1 (Tailwind / Next-Gen)**
*   **Status**: Prototype Phase.
*   **Feature**: Transition to a fully Tailwind-based design system.
*   **Design Goal**: "Wow factor" with glassmorphism, vertical sidebars, and fluid animations.
*   **Refactor**: Moving all monolithic logic from `App.jsx` into the specialized components in `src/components/`.

---

## Technical Summary
| Version | Branding | Port (FE/BE) | CSS Strategy | Status |
| :--- | :--- | :--- | :--- | :--- |
| **V1.0** | Basic Health Demo | 4100 / 4200 | Vanilla CSS | Stable |
| **V3.1** | HealthOS Pro | 4101 / 4201 | Vanilla (Pro CSS) | Active (Masterpiece) |
| **V3.2.1** | HealthOS Core Next | TBD | Tailwind CSS | In Development |
