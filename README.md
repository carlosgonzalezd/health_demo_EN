# Healthcare AI Demo (GB10 Edition)

This is a demonstration of a healthcare application integrating Computer Vision (YOLO) and Large Language Models (Ollama) to analyze medical images.

## Features

- **Medical Image Analysis**: Upload X-rays or scans.
- **Computer Vision**: Detects structures/abnormalities using YOLOv8.
- **Clinical Reports**: Generates professional clinical summaries using a local LLM.
- **Patient Explanation**: Translates medical jargon into simple language for patients.
- **Privacy-First**: All processing happens locally on your GB10 device.

## Architecture

- **Frontend**: React + Vite (Port 80)
- **Backend**: FastAPI (Port 8000)
- **Vision Service**: YOLOv8 / Ultralytics (Port 5000)
- **LLM Service**: Connects to your existing local Ollama instance (Port 11434)

## Prerequisites

- Docker & Docker Compose
- Provide an existing Ollama instance running on the host machine at port 11434.
- Ensure you have a model pulled in Ollama (default is `llama3`, but configurable in `backend/main.py`).

## Quick Start

1.  **Start the Application**:
    ```bash
    docker compose up -d --build
    ```

2.  **Access the Web Interface**:
    Open your browser at [http://localhost](http://localhost) (or the IP of your GB10 server).

3.  **Upload an Image**:
    - Drag and drop a sample X-ray (checkout online datasets like NIH Chest X-ray if needed).
    - Fill in mock patient data.
    - Click "Analyze Case".

## Configuration

- **Ollama URL**: Configured in `docker-compose.yml` as `http://host.docker.internal:11434`.
- **Model**: Default is `llama3`. Change `MODEL_NAME` in `backend/main.py` if you prefer another model (e.g., `mistral`, `medllama2`).

## Troubleshooting

- **"Connection Refused" to Ollama**:
    - Ensure Ollama is running on the host: `curl http://localhost:11434/api/tags`
    - Verify `host.docker.internal` is working. On some setups, you might need to use the host IP specifically.

- **Frontend not loading**:
    - Check if port 80 is occupied.
    - Check logs: `docker compose logs -f frontend-service`

## Disclaimer

**For Demonstration Purposes Only.**
This tool is a proof-of-concept. The AI models (YOLO standard and generic LLMs) are not certified for medical diagnosis. Do not use for real clinical decision making.
