#!/usr/bin/env python3
"""Lightweight stats server that runs on the HOST (not inside Docker).
Exposes GPU / RAM / throughput data for the frontend to poll.
Run: python3 host_stats_server.py
Listens on port 4102.

Optimized for Dell GB10 (Grace Hopper) which uses unified memory (LPDDR5X).
nvidia-smi reports memory as "Not Supported", so we use psutil for system RAM.
"""
from http.server import HTTPServer, BaseHTTPRequestHandler
import subprocess
import json
import time

try:
    import psutil
except ImportError:
    psutil = None

# Track inference throughput
_last_gpu_active = 0
_throughput_estimate = 0

class StatsHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        global _last_gpu_active, _throughput_estimate
        if self.path == '/stats':
            stats = {"gpu": 0, "mem": 0, "throughput": 0, "temp": 0}
            
            # System RAM (unified with GPU on GB10)
            if psutil:
                stats["mem"] = round(psutil.virtual_memory().percent, 1)
            
            # GPU utilization via nvidia-smi
            try:
                r = subprocess.run(
                    ['nvidia-smi', '--query-gpu=utilization.gpu,temperature.gpu', '--format=csv,noheader,nounits'],
                    capture_output=True, text=True, timeout=3
                )
                parts = r.stdout.strip().split(',')
                gpu_val = parts[0].strip()
                if gpu_val.isdigit():
                    stats["gpu"] = int(gpu_val)
                if len(parts) >= 2:
                    temp_val = parts[1].strip()
                    if temp_val.isdigit():
                        stats["temp"] = int(temp_val)
            except Exception:
                pass
            
            # Throughput estimate based on GPU activity
            # When GPU is active (during inference), estimate tokens/s
            if stats["gpu"] > 20:
                _throughput_estimate = max(8, int(stats["gpu"] * 0.6))
                _last_gpu_active = time.time()
            elif time.time() - _last_gpu_active < 5:
                # Keep showing throughput for 5s after GPU goes idle
                _throughput_estimate = max(_throughput_estimate - 2, 0)
            else:
                _throughput_estimate = 0
            
            stats["throughput"] = _throughput_estimate
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(stats).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        self.end_headers()
    
    def log_message(self, format, *args):
        pass  # Suppress logs

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 4102), StatsHandler)
    print("Stats server running on :4102 (GB10 optimized)")
    server.serve_forever()
