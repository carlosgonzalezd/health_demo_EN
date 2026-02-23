# Documentación de la Funcionalidad "Planillas Personal"

## Resumen
Esta nueva funcionalidad permite visualizar y gestionar los turnos de enfermería para 8 quirófanos y 16 enfermeras.

## Componentes

### 1. Backend (`/backend/scheduler.py` y `/backend/main.py`)
Se ha creado un módulo dedicado `scheduler.py` que contiene la lógica de negocio para la generación de turnos.

**Lógica de Rotación Implementada:**
- **Personal**: 16 enfermeras divididas en dos grupos:
    - 8 en "Rotación de Noche" (NightRotation).
    - 8 en "Turno Diurno" (Day).
- **Reglas de Noche**:
    - Las enfermeras de noche rotan 1 semana cada 4 semanas (ciclo mensual).
    - La duración del turno de noche alterna entre 3 y 4 noches cada mes para equilibrar la carga.
    - Durante su semana de noche, NO trabajan en turnos de mañana o tarde.
- **Reglas de Día**:
    - Si no están en turno de noche, se asignan aleatoriamente a turnos de Mañana (M) o Tarde (T) de Lunes a Viernes.

**Endpoint API:**
- `GET /schedule`: Retorna la planilla generada para 12 semanas en formato JSON.

### 2. Frontend (`/frontend/src/App.jsx`)
Se ha añadido una nueva pestaña "Planillas Personal" en la interfaz principal.

**Características:**
- **Visualización**: Tabla de cuadrícula (Enfermeras x Días).
- **Navegación**: Botones para avanzar/retroceder por meses (vista de 4 semanas).
- **Indicadores**:
    - Roles de enfermera (🌙 Rot. Noche vs ☀️ Diurno).
    - Celdas coloreadas según el turno (Amarillo=Mañana, Naranja=Tarde, Índigo=Noche).

## Archivos Modificados/Creados

1.  **`/backend/scheduler.py`** (NUEVO): Contiene la función `generate_schedule` y la configuración `NURSES`.
2.  **`/backend/main.py`** (MODIFICADO): Importa `generate_schedule` y expone el endpoint `/schedule`.
3.  **`/frontend/src/App.jsx`** (MODIFICADO): Añade el estado `schedule`, la función `fetchSchedule`, la lógica de renderizado `renderScheduleGrid` y la nueva pestaña en la navegación.

## Instrucciones de Uso

1.  Asegurarse de que el backend esté ejecutándose (`uvicorn main:app --reload` o similar).
2.  Acceder a la pestaña "Planillas Personal" en la aplicación.
3.  Navegar entre los meses para ver la rotación proyectada.
