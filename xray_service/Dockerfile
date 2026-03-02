FROM nvcr.io/nvidia/pytorch:24.01-py3

WORKDIR /app

RUN apt-get update && apt-get install -y \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
# Fix numpy version conflict: force numpy < 2.0.0 for binary compatibility
RUN python -m pip install --no-cache-dir "numpy<2.0.0"
RUN python -m pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "app.py"]
