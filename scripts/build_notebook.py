import json
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# The FastAPI server source embedded as a string.
SERVER_SOURCE = open(os.path.join(BASE, "backend", "main.py")).read()

def md(text, source="markdown"):
    return {"cell_type": "markdown", "metadata": {}, "source": text.splitlines(keepends=True)}

def code(text, source="code"):
    return {"cell_type": "code", "execution_count": None, "metadata": {},
            "outputs": [], "source": text.splitlines(keepends=True)}

cells = []

# ------------------------------------------------------------------
# 01. Welcome & Configuration
# ------------------------------------------------------------------
cells.append(md("""╔══════════════════════════════════════════════╗
║        IMAGE TO PROMPT AI                    ║
║        COLAB T4 AI SERVER                    ║
╠══════════════════════════════════════════════╣
║ AI Engine: Ollama                            ║
║ Vision Model: Gemma 3 12B                    ║
║ GPU: NVIDIA T4                               ║
║ API: FastAPI                                 ║
║ Tunnel: Cloudflare                           ║
║                                              ║
║ Run all cells to start the server.           ║
╚══════════════════════════════════════════════╝

When the notebook finishes, copy the **API Endpoint** shown at the bottom and paste it into the website at **Settings → AI Connection**."""))

cells.append(code("""
# ---------------------------------------------------------------
# 01. CONFIGURATION
# ---------------------------------------------------------------
# Edit these before running if needed.
MODEL = "gemma3:12b"            # Primary model
FALLBACK_MODEL = "gemma3:4b"    # Used if 12b is unavailable
OLLAMA_PORT = 11434
FASTAPI_PORT = 8000

print("[1/8] Configuration ............ OK")
print(f"  Model: {MODEL}  |  Fallback: {FALLBACK_MODEL}")
"""))

# ------------------------------------------------------------------
# 02. GPU Verification
# ------------------------------------------------------------------
cells.append(code("""
# ---------------------------------------------------------------
# 02. GPU VERIFICATION
# ---------------------------------------------------------------
import subprocess
import sys

print("[2/8] GPU verification ......... ")

try:
    import pynvml
    has_pynvml = True
except Exception:
    has_pynvml = False

gpu_info = None

# Try nvidia-smi first (most reliable on Colab)
try:
    out = subprocess.run(["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader"],
                         capture_output=True, text=True, timeout=30)
    if out.returncode == 0:
        gpu_info = out.stdout.strip().split("\\n")[0]
        print(f"  GPU: {gpu_info}")
except Exception as e:
    print(f"  nvidia-smi unavailable: {e}")

if gpu_info is None and has_pynvml:
    try:
        import pynvml
        pynvml.nvmlInit()
        handle = pynvml.nvmlDeviceGetHandleByIndex(0)
        name = pynvml.nvmlDeviceGetName(handle)
        mem = pynvml.nvmlDeviceGetMemoryInfo(handle)
        gpu_info = f"{name} {mem.total/1024**3:.0f} GB"
        print(f"  GPU: {gpu_info}")
    except Exception as e:
        print(f"  pynvml failed: {e}")

if gpu_info is None:
    print("  ERROR: NVIDIA GPU was not detected.")
    print("  Please select: Runtime -> Change runtime type -> T4 GPU")
    print("  Then re-run all cells.")
    raise SystemExit("NVIDIA GPU not detected. Please enable the T4 GPU runtime.")

print("  NVIDIA GPU detected. CUDA expected.")

# Verify torch/cuda if available (best effort)
try:
    import torch
    print(f"  CUDA available: {torch.cuda.is_available()} | Device: {torch.cuda.get_device_name(0)}")
except Exception:
    print("  torch not installed yet (installed later); skipping CUDA check")
"""))

# ------------------------------------------------------------------
# 03. Install Dependencies
# ------------------------------------------------------------------
cells.append(code("""
# ---------------------------------------------------------------
# 03. INSTALL PYTHON DEPENDENCIES
# ---------------------------------------------------------------
print("[3/8] Installing dependencies .. ")

try:
    import fastapi
    import uvicorn
    import requests
    import multipart
    has_deps = True
except Exception:
    has_deps = False

if not has_deps:
    print("  Installing fastapi, uvicorn, requests, python-multipart...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q",
                           "fastapi", "uvicorn", "requests", "python-multipart", "pynvml"])
    print("  Dependencies installed.")
else:
    print("  Dependencies already present.")

import fastapi, uvicorn, requests, multipart
print("  fastapi:", fastapi.__version__)
"""))

# ------------------------------------------------------------------
# 04. Install Ollama
# ------------------------------------------------------------------
cells.append(code("""
# ---------------------------------------------------------------
# 04. INSTALL OLLAMA (if not present)
# ---------------------------------------------------------------
import os
import shutil
import time

print("[4/8] Installing Ollama ........ ")

OLLAMA_BIN = "/usr/local/bin/ollama"
OLLAMA_OK = True

if os.path.exists(OLLAMA_BIN) and shutil.which("ollama"):
    print("  Ollama already installed.")
else:
    print("  Ollama not found. Downloading installer...")
    # Avoid re-downloading if a cached copy exists
    installer = "/content/ollama-install.sh"
    if not os.path.exists(installer):
        subprocess.check_call(["curl", "-fsSL", "https://ollama.com/install.sh", "-o", installer], timeout=300)
    subprocess.check_call(["sh", installer], timeout=600)
    # Re-check
    if not os.path.exists(OLLAMA_BIN):
        print("  ERROR: Ollama installation failed.")
        OLLAMA_OK = False
    else:
        print("  Ollama installed.")

if OLLAMA_OK:
    try:
        ver = subprocess.run(["ollama", "--version"], capture_output=True, text=True, timeout=60)
        print(f"  {ver.stdout.strip() or ver.stderr.strip()}")
    except Exception:
        pass
"""))

# ------------------------------------------------------------------
# 05. Start Ollama
# ------------------------------------------------------------------
cells.append(code("""
# ---------------------------------------------------------------
# 05. START OLLAMA
# ---------------------------------------------------------------
import subprocess
import requests
import time

print("[5/8] Starting Ollama .......... ")

# Kill any previous ollama process cleanly
subprocess.run(["pkill", "-f", "ollama"], capture_output=True)
time.sleep(2)

# Start Ollama server in the background
ollama_env = os.environ.copy()
ollama_env["OLLAMA_HOST"] = "127.0.0.1:11434"
# Limit threads to avoid OOM/resource issues on T4
ollama_env.setdefault("OLLAMA_NUM_PARALLEL", "1")

proc = subprocess.Popen(
    ["ollama", "serve"],
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
    env=ollama_env,
)

# Wait for ollama to respond
ollama_ready = False
for _ in range(60):
    try:
        r = requests.get("http://127.0.0.1:11434/", timeout=2)
        if r.status_code == 200:
            ollama_ready = True
            print("  Ollama server is ONLINE on 127.0.0.1:11434")
            break
    except Exception:
        pass
    time.sleep(2)

if not ollama_ready:
    print("  ERROR: Ollama failed to start within the timeout.")
else:
    print("  Ollama responding successfully.")
"""))

# ------------------------------------------------------------------
# 06. Install / Verify Gemma model
# ------------------------------------------------------------------
cells.append(code("""
# ---------------------------------------------------------------
# 06. INSTALL / VERIFY GEMMA MODEL
# ---------------------------------------------------------------
print("[6/8] Verifying Gemma model ..... ")

def list_models():
    try:
        r = requests.get("http://127.0.0.1:11434/api/tags", timeout=10)
        if r.status_code == 200:
            return [m.get("name", "") for m in r.json().get("models", [])]
    except Exception:
        pass
    return []

def has_model(model):
    base = model.split(":")[0]
    return any(m.split(":")[0] == base for m in list_models())

if has_model(MODEL):
    print(f"  Model {MODEL} already installed.")
else:
    print(f"  Model {MODEL} not found. Pulling...")
    rc = subprocess.run(["ollama", "pull", MODEL], capture_output=True, text=True, timeout=3600)
    if rc.returncode == 0 and has_model(MODEL):
        print(f"  Model {MODEL} installed successfully.")
    else:
        # Try fallback model
        print(f"  Failed to install {MODEL}. Trying fallback {FALLBACK_MODEL}...")
        subprocess.run(["pkill", "-f", "ollama"], capture_output=True)
        time.sleep(2)
        ollama_proc = subprocess.Popen(["ollama", "serve"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, env=ollama_env)
        rc2 = subprocess.run(["ollama", "pull", FALLBACK_MODEL], capture_output=True, text=True, timeout=3600)
        if rc2.returncode == 0 and has_model(FALLBACK_MODEL):
            MODEL = FALLBACK_MODEL
            print(f"  Using fallback model: {MODEL}")
        else:
            print("  ERROR: Neither model could be installed.")
            print("  Please re-run this cell after checking your internet connection.")

actual_model = MODEL if has_model(MODEL) else (FALLBACK_MODEL if has_model(FALLBACK_MODEL) else None)
print(f"  Active model: {actual_model}")
"""))

# ------------------------------------------------------------------
# 07. Create FastAPI server
# ------------------------------------------------------------------
cells.append(code(f"""
# ---------------------------------------------------------------
# 07. CREATE FASTAPI SERVER
# ---------------------------------------------------------------
# The server source is created automatically. No manual file setup needed.

SERVER_PATH = "/content/image_to_prompt_server.py"

server_source = r'''{SERVER_SOURCE}'''

with open(SERVER_PATH, "w") as f:
    f.write(server_source)

# Make sure MODEL is set into the server environment
import os
os.environ["IMAGE_TO_PROMPT_MODEL"] = actual_model or "gemma3:12b"

print(f"[7/8] FastAPI server created at {{SERVER_PATH}}")
print("  Routes: GET /   GET /health   POST /analyze-image   POST /analyze-images")
"""))

# ------------------------------------------------------------------
# 08. Start FastAPI
# ------------------------------------------------------------------
cells.append(code("""
# ---------------------------------------------------------------
# 08. START FASTAPI
# ---------------------------------------------------------------
import subprocess
import requests
import time

print("[8/8] Starting FastAPI .......... ")

# Kill previous server if running
subprocess.run(["pkill", "-f", SERVER_PATH], capture_output=True)
subprocess.run(["pkill", "-f", "uvicorn"], capture_output=True)
time.sleep(2)

server_proc = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "image_to_prompt_server:app",
     "--host", "0.0.0.0", "--port", str(FASTAPI_PORT)],
    cwd="/content",
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)

# Wait for FastAPI to respond
fastapi_ready = False
for _ in range(60):
    try:
        r = requests.get(f"http://127.0.0.1:{FASTAPI_PORT}/health", timeout=2)
        if r.status_code == 200:
            fastapi_ready = True
            print(f"  FastAPI is ONLINE on 0.0.0.0:{FASTAPI_PORT}")
            print("  Health:", r.json())
            break
    except Exception:
        pass
    time.sleep(2)

if not fastapi_ready:
    print("  ERROR: FastAPI failed to start.")
    print("  See Troubleshooting section below.")
"""))

# ------------------------------------------------------------------
# 09. Start Cloudflare tunnel
# ------------------------------------------------------------------
cells.append(code("""
# ---------------------------------------------------------------
# 09. START CLOUDFLARE TUNNEL
# ---------------------------------------------------------------
import subprocess
import time

print("Starting Cloudflare Tunnel .... ")

# Install cloudflared if not present
if not shutil.which("cloudflared"):
    print("  Installing cloudflared...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "cloudflared"])
    # cloudflared binary may come from pip cache; if not, download
    if not shutil.which("cloudflared"):
        subprocess.check_call(["curl", "-fsSL",
            "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64",
            "-o", "/usr/local/bin/cloudflared"], timeout=300)
        os.chmod("/usr/local/bin/cloudflared", 0o755)
    print("  cloudflared installed.")

# Kill any old tunnel
subprocess.run(["pkill", "-f", "cloudflared"], capture_output=True)
time.sleep(2)

# Start tunnel pointing at local FastAPI
tunnel_proc = subprocess.Popen(
    ["cloudflared", "tunnel", "--url", f"http://localhost:{FASTAPI_PORT}"],
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True,
    bufsize=1,
)

print("  Waiting for tunnel URL...")
tunnel_url = None
for _ in range(120):
    line = tunnel_proc.stdout.readline()
    if not line:
        time.sleep(1)
        continue
    if "trycloudflare.com" in line:
        import re
        m = re.search(r"(https://[\\w-]+\\.trycloudflare\\.com)", line)
        if m and not tunnel_url:
            tunnel_url = m.group(1)
            break
    time.sleep(0.5)

if not tunnel_url:
    print("  ERROR: Could not detect the Cloudflare tunnel URL.")
else:
    print(f"  Tunnel detected: {tunnel_url}")
"""))

# ------------------------------------------------------------------
# 10. Verify public endpoint
# ------------------------------------------------------------------
cells.append(code("""
# ---------------------------------------------------------------
# 10. VERIFY PUBLIC ENDPOINT
# ---------------------------------------------------------------
import requests
import time

print("Verifying public endpoint ..... ")

if not tunnel_url:
    print("  No tunnel URL available. Verification skipped.")
else:
    public_ok = False
    for _ in range(30):
        try:
            r = requests.get(tunnel_url + "/health", timeout=10)
            if r.status_code == 200:
                public_ok = True
                print("  Public /health -> HTTP 200")
                print("  Health payload:", r.json())
                break
        except Exception:
            pass
        time.sleep(2)

    if not public_ok:
        print("  WARNING: Public endpoint health check did not return 200 yet.")
        print("  The tunnel may still be propagating. Please retry in a moment.")
"""))

# ------------------------------------------------------------------
# 11. Display connection information
# ------------------------------------------------------------------
cells.append(code("""
# ---------------------------------------------------------------
# 11. DISPLAY CONNECTION INFORMATION
# ---------------------------------------------------------------
print()

if tunnel_url:
    print("=" * 60)
    print("  IMAGE TO PROMPT AI - READY")
    print("=" * 60)
    print(f"  GPU             NVIDIA T4")
    print(f"  Ollama          ● ONLINE")
    print(f"  Model           {actual_model or MODEL}")
    print(f"  FastAPI         ● ONLINE (localhost:{FASTAPI_PORT})")
    print(f"  Tunnel          ● ONLINE")
    print()
    print("  API ENDPOINT")
    print()
    print(f"  {tunnel_url}")
    print()
    print("  Copy this URL into the website Settings.")
    print("  Settings -> AI Connection -> paste -> Test Connection")
    print("=" * 60)
    print()
    print("When finished, stop the Colab runtime to release the T4 GPU.")
else:
    print("=" * 60)
    print("  IMAGE TO PROMPT AI - TUNNEL NOT READY")
    print("=" * 60)
    print("  The tunnel URL could not be detected.")
    print("  Please scroll up and check the Cloudflare output.")
    print("  See the Troubleshooting cell below.")
    print("=" * 60)
"""))

# ------------------------------------------------------------------
# 12. API test
# ------------------------------------------------------------------
cells.append(code("""
# ---------------------------------------------------------------
# 12. API TEST (optional)
# ---------------------------------------------------------------
print()
print("Testing API /health .......... ")

try:
    r = requests.get(f"http://localhost:{FASTAPI_PORT}/health", timeout=10)
    print("  Local /health ->", r.status_code, r.json())
except Exception as e:
    print("  Local health check failed:", e)

if tunnel_url:
    try:
        r = requests.get(tunnel_url + "/health", timeout=10)
        print("  Public /health ->", r.status_code, r.json())
    except Exception as e:
        print("  Public health check failed:", e)

print()
print("You can now use the 'Image to Prompt' page on the website.")
print("Upload an image and click Generate Prompt.")
"""))

# ------------------------------------------------------------------
# 13. Troubleshooting
# ------------------------------------------------------------------
cells.append(code("""
# ---------------------------------------------------------------
# 13. TROUBLESHOOTING
# ---------------------------------------------------------------
# If something failed, run these checks.

print("Running diagnostics ..........")
import shutil

checks = []

# 1. GPU
try:
    out = subprocess.run(["nvidia-smi", "--query-gpu=name", "--format=csv,noheader"],
                         capture_output=True, text=True, timeout=30)
    checks.append(("GPU", out.returncode == 0, out.stdout.strip() or "no GPU"))
except Exception as e:
    checks.append(("GPU", False, str(e)))

# 2. Ollama binary
checks.append(("Ollama binary", shutil.which("ollama") is not None, shutil.which("ollama") or "not found"))

# 3. Ollama server
try:
    r = requests.get("http://127.0.0.1:11434/", timeout=5)
    checks.append(("Ollama server", r.status_code == 200, f"HTTP {r.status_code}"))
except Exception as e:
    checks.append(("Ollama server", False, str(e)))

# 4. Model
try:
    r = requests.get("http://127.0.0.1:11434/api/tags", timeout=5)
    names = [m.get("name") for m in r.json().get("models", [])]
    checks.append(("Model installed", bool(names), ", ".join(names) or "none"))
except Exception as e:
    checks.append(("Model installed", False, str(e)))

# 5. FastAPI
try:
    r = requests.get(f"http://localhost:{FASTAPI_PORT}/health", timeout=5)
    checks.append(("FastAPI", r.status_code == 200, f"HTTP {r.status_code}"))
except Exception as e:
    checks.append(("FastAPI", False, str(e)))

# 6. cloudflared binary
checks.append(("cloudflared binary", shutil.which("cloudflared") is not None, shutil.which("cloudflared") or "not found"))

print()
for name, ok, val in checks:
    status = "OK" if ok else "FAILED"
    print(f"  {name:<18} {status:<8} {val}")

failed = [c for c in checks if not c[1]]
if failed:
    print()
    print("FAILED COMPONENTS:")
    for name, _, val in failed:
        print(f"  - {name}: {val}")
    print()
    print("Common fixes:")
    print("  - GPU: Runtime -> Change runtime type -> T4 GPU, restart runtime, re-run all.")
    print("  - Ollama: Re-run cells 04-06.")
    print("  - Model: Ensure internet access, re-run cell 06.")
    print("  - FastAPI: Re-run cells 07-08.")
    print("  - Tunnel: Re-run cell 09-10.")
    print()
    print("If 'Run all' fails due to a stuck session, use:")
    print("  Runtime -> Restart runtime, then re-run all cells.")
else:
    print()
    print("All diagnostic checks passed.")
"""))

# Save to the target file (under colab/)
out_dir = os.path.join(BASE, "colab")
os.makedirs(out_dir, exist_ok=True)
out_path = os.path.join(out_dir, "Image_to_Prompt_AI_Colab_T4.ipynb")

notebook = {
    "nbformat": 4,
    "nbformat_minor": 0,
    "metadata": {
        "colab": {"provenance": [], "name": "Image to Prompt AI - Colab T4"},
        "kernelspec": {"name": "python3", "display_name": "Python 3"},
        "language_info": {"name": "python"},
    },
    "cells": cells,
}

with open(out_path, "w", encoding="utf-8") as f:
    json.dump(notebook, f, indent=1, ensure_ascii=False)

print(f"\nNotebook written to: {out_path}")
print(f"Total cells: {len(cells)}")
