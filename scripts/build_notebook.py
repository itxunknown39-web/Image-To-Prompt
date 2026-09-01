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

# Notebook version marker. If Colab is running an older notebook
# this value will be missing or stale -> re-import the new notebook.
NOTEBOOK_VERSION = "2026-09-01-OLLAMA-FIX-V2"

print("Image to Prompt AI - Colab Backend")
print(f"Notebook version: {NOTEBOOK_VERSION}")

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
    pip_res = subprocess.run(
        [sys.executable, "-m", "pip", "install", "-q",
         "fastapi", "uvicorn", "requests", "python-multipart", "pynvml"],
        capture_output=True, text=True,
    )
    if pip_res.returncode != 0:
        print("  ERROR: dependency installation failed (exit %d)." % pip_res.returncode)
        if pip_res.stderr.strip():
            print("  --- pip stderr (tail) ---")
            print(pip_res.stderr.strip()[-2000:])
            print("  -------------------------")
        raise RuntimeError(
            "Python dependency installation failed. "
            "See pip output above; likely an internet or pip index issue."
        )
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
# 04. INSTALL OLLAMA (robust, diagnostic, idempotent)
# ---------------------------------------------------------------
import os
import sys
import time
import shutil
import socket
import subprocess
import platform

INSTALLER_URL = "https://ollama.com/install.sh"
INSTALLER_PATH = "/content/ollama-install.sh"
OLLAMA_BIN = "/usr/local/bin/ollama"

print("[4/8] Installing Ollama ........ ")
print(f"Notebook version: {NOTEBOOK_VERSION}")
print()

# -- 4a. Detect -> verify the Colab environment -------------------
def detect_env():
    info = {
        "os": platform.system(),
        "arch": platform.machine(),
        "python": sys.version.split()[0],
        "gpu": "unknown",
        "gpu_ok": False,
        "ollama_path": shutil.which("ollama") or None,
    }
    # nvidia-smi is the most reliable GPU probe in Colab
    try:
        out = subprocess.run(
            ["nvidia-smi", "--query-gpu=name,memory.total", "--format=csv,noheader"],
            capture_output=True, text=True, timeout=30,
        )
        if out.returncode == 0:
            info["gpu"] = out.stdout.strip().split("\\n")[0]
            info["gpu_ok"] = True
        else:
            info["gpu"] = "nvidia-smi returned non-zero"
    except FileNotFoundError:
        info["gpu"] = "nvidia-smi not found"
    except Exception as e:
        info["gpu"] = str(e)
    return info

env = detect_env()

# Capability requirements: Linux + amd64/x86_64 + NVIDIA GPU + python.
# Do NOT hard-code the GPU name (a different NVIDIA GPU is fine).
print("  Environment:")
print(f"    OS          {env['os']}")
print(f"    Arch        {env['arch']}")
print(f"    Python      {env['python']}")
print(f"    GPU         {env['gpu']}")
print(f"    Ollama path {env['ollama_path'] or 'not present'}")

problems = []
if env["os"] != "Linux":
    problems.append("This notebook requires a Linux environment (Google Colab).")
if env["arch"] not in ("x86_64", "amd64"):
    problems.append(f"Ollama requires x86_64/amd64; detected {env['arch']}.")
if not env["gpu_ok"]:
    problems.append(
        "NVIDIA GPU not detected. Select Runtime -> Change runtime type -> T4 GPU, "
        "then Runtime -> Restart runtime and re-run all cells."
    )
if problems:
    print()
    for p in problems:
        print("  ERROR:", p)
    raise RuntimeError("Pre-install environment check failed. " + "; ".join(problems))

# -- 4b. Disk space check ------------------------------------------
# Ollama + Gemma 3 12B need roughly 8-10 GB free. Do not reject unless
# genuinely too low; otherwise recommend the 4B model.
try:
    st = os.statvfs("/content")
    free_gb = (st.f_bavail * st.f_frsize) / (1024 ** 3)
except Exception:
    free_gb = None

if free_gb is not None:
    print(f"  Available disk space: {free_gb:.1f} GB")
    if free_gb < 6:
        print("  WARNING: Low disk space.")
        print("  Recommendation: prefer the smaller model gemma3:4b")
        print("  (edit MODEL in the Configuration cell and re-run).")
else:
    print("  Available disk space: could not determine")

# -- 4c. Network connectivity check --------------------------------
print()
print("  Checking connectivity to the Ollama installer source...")
def _net_ok(host, port, timeout=15):
    try:
        socket.create_connection((host, port), timeout=timeout)
        return True
    except Exception:
        return False

if not _net_ok("ollama.com", 443):
    print("  ERROR: Internet connectivity / Ollama download failed.")
    print("  Unable to reach ollama.com:443.")
    print("  Check your Colab internet access and retry.")
    raise RuntimeError(
        "Internet connectivity / Ollama download failed: cannot reach ollama.com:443. "
        "Enable Colab internet access and re-run this cell."
    )
print("  Connectivity OK (ollama.com:443 reachable).")

# -- 4d. Install if not already present ----------------------------
print()
if env["ollama_path"] and os.path.exists(env["ollama_path"]):
    print("  Checking existing installation...")
    print("  Ollama already installed.")
else:
    print("  Checking existing installation...")
    print("  Ollama not found.")

    print()
    print("  Downloading official Ollama installer...")
    try:
        dl = subprocess.run(
            ["curl", "-fsSL", INSTALLER_URL, "-o", INSTALLER_PATH],
            capture_output=True, text=True, timeout=300,
        )
    except Exception as e:
        raise RuntimeError(
            f"Internet connectivity / Ollama download failed. curl error: {e}. "
            "Check internet access and re-run this cell."
        )
    if dl.returncode != 0:
        raise RuntimeError(
            "Internet connectivity / Ollama download failed. "
            f"curl exit code: {dl.returncode}.\\n{dl.stderr.strip()}"
        )
    if not os.path.exists(INSTALLER_PATH) or os.path.getsize(INSTALLER_PATH) == 0:
        raise RuntimeError("Installer downloaded but the file is empty or missing.")
    print("  Installer downloaded.")

    print()
    print("  Installing Ollama...")
    # Use bash (not sh) for correct flags; capture both streams so we can
    # show the real error instead of an opaque CalledProcessError.
    try:
        inst = subprocess.run(
            ["bash", INSTALLER_PATH],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            timeout=900,
        )
    except subprocess.TimeoutExpired:
        print("  Installer timed out after 900s.")
        print("  The installer may be slow on this runtime; re-run this cell to continue.")
        raise RuntimeError("Ollama installer timed out. Re-run this cell to retry.")
    except Exception as e:
        raise RuntimeError(f"Ollama installer could not be run: {e}")

    # Never hide installer output.
    if inst.stdout:
        print("  --- installer output ---")
        print(inst.stdout.rstrip())
        print("  ------------------------")

    if inst.returncode != 0:
        print()
        print("  ===========================================================")
        print("  ERROR: Ollama installation failed.")
        print(f"  Installer exit code: {inst.returncode}")
        print()
        print("  Environment:")
        print(f"    OS          {env['os']}")
        print(f"    Architecture {env['arch']}")
        print(f"    Python      {env['python']}")
        print(f"    Ollama path {env['ollama_path'] or 'not present'}")
        print()
        print("  The most common causes are:")
        print("    1. The installer could not write to /usr/local/bin (permissions).")
        print("    2. A transient network failure during the install.")
        print("    3. Docker/systemd-specific checks the non-root Colab box skips.")
        print()
        print("  Recommended fix: Runtime -> Restart runtime, then re-run all cells.")
        print("  ===========================================================")
        raise RuntimeError(
            f"Ollama installation failed. Installer exit code: {inst.returncode}. "
            "See the installer output above for the real cause."
        )
    print()
    print("  Installer completed.")

# -- 4e. Verify the binary -----------------------------------------
print()
print("  Verifying installation...")
ollama_bin = shutil.which("ollama")
if not ollama_bin:
    raise RuntimeError(
        'Ollama installation reported success but the "ollama" binary is not on PATH. '
        "Open a new Colab session and re-run the notebook."
    )

try:
    ver = subprocess.run([ollama_bin, "--version"], capture_output=True, text=True, timeout=60)
except Exception as e:
    raise RuntimeError(f"Ollama binary found but could not run: {e}")

if ver.returncode == 0:
    print("  Ollama installed successfully.")
    print(f"  Version: {ver.stdout.strip() or ver.stderr.strip()}")
else:
    print("  WARNING: ollama --version returned non-zero.")
    print("  stdout:", ver.stdout.strip())
    print("  stderr:", ver.stderr.strip())
    print("  Continuing anyway; the server startup step will attempt to run it.")
"""))

# ------------------------------------------------------------------
# 05. Start Ollama
# ------------------------------------------------------------------
cells.append(code("""
# ---------------------------------------------------------------
# 05. START OLLAMA (robust, idempotent)
# ---------------------------------------------------------------
import os
import time
import shutil
import subprocess
import requests

OLLAMA_LOG = "/content/ollama.log"

print("[5/8] Starting Ollama .......... ")
print()

def ollama_responding():
    try:
        r = requests.get("http://127.0.0.1:11434/api/tags", timeout=3)
        return r.status_code == 200
    except Exception:
        return False

ollama_bin = shutil.which("ollama")
if not ollama_bin:
    raise RuntimeError(
        'The "ollama" binary was not found. The installation in the previous cell may have failed. '
        "Re-run cell 04 or check the Diagnostics cell."
    )

# -- 5a. Detect -> is a server already running? --------------------
print("  Checking for a running Ollama server...")
if ollama_responding():
    print("  An Ollama server is already responding on 127.0.0.1:11434.")
    print("  Reusing the existing server; no restart needed.")
    ollama_proc = None
else:
    print("  No responding Ollama server detected.")
    print("  Cleaning up any stale Ollama processes (only Ollama, not unrelated procs)...")
    # Only kill stale ollama processes; do not blindly kill everything.
    subprocess.run(["pkill", "-f", "ollama"], capture_output=True)
    time.sleep(2)

    # -- 5b. Start server, capturing logs to a file ----------------
    ollama_env = os.environ.copy()
    ollama_env["OLLAMA_HOST"] = "127.0.0.1:11434"
    # Limit threads to avoid OOM/resource issues on T4
    ollama_env.setdefault("OLLAMA_NUM_PARALLEL", "1")

    print(f"  Starting Ollama server (logs -> {OLLAMA_LOG})...")
    with open(OLLAMA_LOG, "w") as logf:
        ollama_proc = subprocess.Popen(
            [ollama_bin, "serve"],
            stdout=logf,
            stderr=subprocess.STDOUT,
            env=ollama_env,
        )

    # -- 5c. Wait for health endpoint with a timeout ---------------
    ollama_ready = False
    for attempt in range(60):
        if ollama_proc.poll() is not None:
            print("  ERROR: Ollama server process exited early.")
            break
        if ollama_responding():
            ollama_ready = True
            break
        time.sleep(2)

    if ollama_ready:
        print("  Ollama server is ONLINE on 127.0.0.1:11434")
        print("  Ollama responding successfully.")
    else:
        print("  ERROR: Ollama failed to start within the timeout.")
        print(f"  Checking server log ({OLLAMA_LOG})...")
        try:
            with open(OLLAMA_LOG) as logf:
                log = logf.read().strip()
            print("  --- server log ---")
            print(log[-2000:] if log else "(log is empty)")
            print("  ------------------")
        except Exception as e:
            print("  Could not read server log:", e)
        if ollama_proc is not None and ollama_proc.poll() is not None:
            print(f"  Server process exited with code {ollama_proc.poll()}.")
        raise RuntimeError(
            "Ollama server failed to start. See the server log above for the real cause."
        )

# -- 5d. Final verification -----------------------------------------
if ollama_proc is not None and ollama_proc.poll() is None:
    print("  Server process alive (PID %d)." % ollama_proc.pid)
elif ollama_proc is None:
    print("  Using pre-existing server.")
print("  Ollama ready.")
"""))

# ------------------------------------------------------------------
# 06. Install / Verify Gemma model
# ------------------------------------------------------------------
cells.append(code("""
# ---------------------------------------------------------------
# 06. INSTALL / VERIFY GEMMA MODEL (robust, idempotent)
# ---------------------------------------------------------------
import os
import time
import subprocess
import requests

OLLAMA_LOG = "/content/ollama.log"

print("[6/8] Verifying Gemma model ..... ")
print()

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

def server_up():
    try:
        r = requests.get("http://127.0.0.1:11434/api/tags", timeout=5)
        return r.status_code == 200
    except Exception:
        return False

def ensure_server():
    # Best-effort recovery: if the server stopped, restart it (logs to file).
    if server_up():
        return
    print("  Ollama server is not responding; restarting it...")
    subprocess.run(["pkill", "-f", "ollama"], capture_output=True)
    time.sleep(2)
    with open(OLLAMA_LOG, "w") as logf:
        subprocess.Popen(
            ["ollama", "serve"],
            stdout=logf,
            stderr=subprocess.STDOUT,
            env=os.environ.copy(),
        )
    for _ in range(30):
        if server_up():
            break
        time.sleep(2)
    if not server_up():
        print("  WARNING: could not confirm the Ollama server is up.")
        with open(OLLAMA_LOG) as f:
            print("  --- server log (tail) ---")
            print(f.read()[-1500:])
            print("  -------------------------")

def pull_model(model):
    # Pull a model, streaming progress, returning (ok, output).
    print(f"  Pulling {model}...")
    run = subprocess.Popen(
        ["ollama", "pull", model],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )
    tail = []
    for line in run.stdout:
        line = line.rstrip()
        if line:
            tail.append(line)
            # Only echo a few progress lines to avoid flooding the cell output.
            if len(tail) <= 3 or "success" in line.lower() or "error" in line.lower():
                print("    " + line)
    run.wait(timeout=3600)
    return run.returncode, "\\n".join(tail[-40:])

# -- 6a. Check 12B model -------------------------------------------
print(f"  Checking for {MODEL}...")
if has_model(MODEL):
    print(f"  Model {MODEL} already installed. Skipping pull.")
    active_model = MODEL
else:
    print(f"  Model {MODEL} not found.")

    # Disk space recommendation before a large pull.
    try:
        st = os.statvfs("/content")
        free_gb = (st.f_bavail * st.f_frsize) / (1024 ** 3)
        print(f"  Available disk space: {free_gb:.1f} GB")
        if free_gb < 8:
            print(f"  WARNING: low disk space for {MODEL} (needs ~8-10 GB).")
            print(f"  Recommendation: use the smaller model {FALLBACK_MODEL} instead.")
    except Exception:
        pass

    ensure_server()
    rc, output = pull_model(MODEL)

    if rc == 0 and has_model(MODEL):
        print(f"  Model {MODEL} installed successfully.")
        active_model = MODEL
    else:
        print()
        print(f"  Failed to pull {MODEL}.")
        if output:
            print("  --- pull output (tail) ---")
            print(output)
            print("  ---------------------------")
        print(f"  Trying fallback model {FALLBACK_MODEL}...")
        ensure_server()
        rc2, output2 = pull_model(FALLBACK_MODEL)

        if rc2 == 0 and has_model(FALLBACK_MODEL):
            active_model = FALLBACK_MODEL
            print()
            print(f"  Using the smaller fallback model: {active_model}")
            print("  Note: 4B is faster but less detailed than 12B.")
        else:
            print()
            print("  ERROR: Neither model could be installed.")
            if output2:
                print("  --- fallback pull output (tail) ---")
                print(output2)
                print("  ------------------------------------")
            raise RuntimeError(
                "Model installation failed. "
                f"Primary ({MODEL}) and fallback ({FALLBACK_MODEL}) both failed. "
                "Check internet access, disk space, and that Ollama is running; "
                "then re-run cells 04-06."
            )

# -- 6b. Verify the active model exists and announce it -----------
ensure_server()
if not has_model(active_model):
    print(f"  WARNING: {active_model} not confirmed in /api/tags, but continuing.")
print()
print(f"  Active model: {active_model}")
actual_model = active_model
os.environ["IMAGE_TO_PROMPT_MODEL"] = actual_model
print(f"  IMAGE_TO_PROMPT_MODEL set to: {os.environ['IMAGE_TO_PROMPT_MODEL']}")
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

FASTAPI_LOG = "/content/fastapi.log"

print("[8/8] Starting FastAPI .......... ")

# Kill previous server if running
subprocess.run(["pkill", "-f", SERVER_PATH], capture_output=True)
subprocess.run(["pkill", "-f", "uvicorn"], capture_output=True)
time.sleep(2)

print(f"  Starting FastAPI server (logs -> {FASTAPI_LOG})...")
with open(FASTAPI_LOG, "w") as logf:
    server_proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "image_to_prompt_server:app",
         "--host", "0.0.0.0", "--port", str(FASTAPI_PORT)],
        cwd="/content",
        stdout=logf,
        stderr=subprocess.STDOUT,
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
    print(f"  Checking server log ({FASTAPI_LOG})...")
    try:
        with open(FASTAPI_LOG) as logf:
            print("  --- fastapi log (tail) ---")
            print(logf.read()[-2000:])
            print("  --------------------------")
    except Exception as e:
        print("  Could not read FastAPI log:", e)
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
    pip_res = subprocess.run([sys.executable, "-m", "pip", "install", "-q", "cloudflared"],
                             capture_output=True, text=True)
    if pip_res.returncode != 0:
        print("    pip install cloudflared failed (exit %d)." % pip_res.returncode)
        print("    Falling back to direct binary download...")
    # cloudflared binary may come from pip cache; if not, download
    if not shutil.which("cloudflared"):
        dl_res = subprocess.run(
            ["curl", "-fsSL",
             "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64",
             "-o", "/usr/local/bin/cloudflared"],
            capture_output=True, text=True, timeout=300,
        )
        if dl_res.returncode != 0:
            print("  ERROR: could not download cloudflared.")
            print("    curl exit code:", dl_res.returncode)
            if dl_res.stderr.strip():
                print("    stderr:", dl_res.stderr.strip())
            print("  The tunnel cannot start, but the local FastAPI server is still running.")
            raise RuntimeError(
                "cloudflared could not be installed. "
                "Check internet access and re-run this cell."
            )
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
