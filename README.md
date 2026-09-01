# Image to Prompt AI

Transform any image into a professional, AI-ready image-generation prompt.

Upload an image → analyze it with **Gemma 3 Vision** on an **NVIDIA T4 GPU** (Google Colab) via **Ollama** → receive a detailed, structured, commercially useful prompt.

---

## Features

- **Image → Prompt**: Upload JPG, PNG, WEBP, or AVIF images (up to 20 MB each) and generate detailed professional prompts.
- **Drag & drop** support with preview.
- **Multiple image** processing (queued sequentially to protect T4 VRAM).
- **Processing states**: Waiting, Analyzing, Generating, Completed, Failed.
- **Result cards**: Copy, Redo, Download (`.txt` and `.json`), expandable description, keywords.
- **History**: Local-only record of up to 50 past results.
- **Settings**:
  - AI Connection (api endpoint, save, test, live status)
  - Colab Setup (7-step guided configuration)
  - Preferences
- **Connection indicator** in the global header.
- **Responsive**: sidebar (desktop), collapsible sidebar (tablet), bottom navigation (mobile).
- **Accessible**: keyboard navigation, focus states, labels, alt text, ARIA status.

---

## Architecture

```
                    IMAGE TO PROMPT AI
                         │
                         │ HTTPS
                         ▼
                  CLOUDFLARE TUNNEL (temporary)
                         │
                         ▼
                    GOOGLE COLAB (NVIDIA T4 GPU)
                         │
                      FastAPI
                         │
                      Ollama
                         │
                  Gemma 3 Vision (gemma3:12b)
                         │
                         ▼
                    JSON RESPONSE
                         │
                         ▼
                    FRONTEND (Vercel)
```

- **Frontend**: React + Vite, hosted permanently on **Vercel**.
- **AI runtime**: Google Colab **NVIDIA T4** (temporary).
- **AI engine**: **Ollama**.
- **Vision model**: **Gemma 3 12B** (`gemma3:12b`), optional fallback `gemma3:4b`.
- **API layer**: **FastAPI**.
- **Public tunnel**: **Cloudflare Quick Tunnel** (temporary HTTPS URL).
- **Database**: none. **Authentication**: none. **Paid AI APIs**: none.

The frontend is permanently deployed and works independently. The AI backend runs temporarily inside Colab and only works while the Colab runtime is active.

---

## Local Development

### Prerequisites

- Node.js 18+ (for the frontend)
- Python 3.9+ (only if you run the backend standalone for testing)

### 1. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

### 2. Optional: run the FastAPI backend locally (for API testing)

```bash
pip install fastapi uvicorn requests python-multipart
uvicorn backend.main:app --reload --port 8000
```

> The backend normally runs inside Google Colab. Running it locally requires a local Ollama + Gemma install.

---

## Google Colab Setup

The AI backend is provided as a version-controlled notebook. You do **not** need to create backend files manually, and you do **not** need a Google Drive copy.

### Google Colab Notebook

**Permanent notebook:**

```
https://colab.research.google.com/github/itxunknown39-web/Image-To-Prompt/blob/main/colab/Image_to_Prompt_AI_Colab_T4.ipynb
```

> The notebook lives in `colab/Image_to_Prompt_AI_Colab_T4.ipynb` on the `main` branch of this GitHub repository. Opening the permanent URL above loads the current notebook directly from GitHub — no Google Drive upload or copy is required.

1. Open the permanent GitHub → Colab URL above.
2. Select **Runtime → Change runtime type → NVIDIA T4 GPU** and click **Save**.
3. Click **Runtime → Run all**.
4. Wait for the **IMAGE TO PROMPT AI — READY** status panel.
5. Copy the **API Endpoint** (e.g. `https://xxxxx.trycloudflare.com`).
6. Paste it into the website at **Settings → AI Connection**.

The notebook is version-controlled in GitHub. Whenever the notebook is updated on the `main` branch, opening the same permanent URL loads the latest version — there is no copied notebook to maintain.

The notebook automatically handles:

- T4 GPU verification (with a clear error if not enabled)
- Ollama installation (skipped if already present)
- Ollama startup and health verification
- Gemma 3 12B model installation (`ollama pull gemma3:12b`, with a 4b fallback)
- Python dependency installation
- FastAPI server creation and startup (`/health`, `/analyze-image`, `/analyze-images`)
- Cloudflare tunnel startup
- Public endpoint health verification
- Final status panel with diagnostics and troubleshooting

---

## Vercel Deployment

The repo root is configured for Vercel (see root `vercel.json`). When the project is imported, Vercel:

- Builds with the root `npm run build` (`node scripts/deploy-build.js` builds the `frontend/` Vite app).
- Serves the output directory `frontend/dist`.
- Uses an SPA rewrite so all client-side routes ( `/`, `/image-to-prompt`, `/history`, `/settings`) resolve to `index.html`.

To deploy:

1. Connect the GitHub repo to Vercel.
2. Leave **Root Directory** empty (the repo root now builds the whole app), or set it to `frontend/` and use build command `npm run build` / output `dist`.
3. Add the environment variable below.
4. Deploy.

### Local build (same as the production build)

```bash
npm install        # installs root tooling (no runtime deps at root)
npm run build      # builds frontend/ -> frontend/dist
```

### Environment variables

Set **`VITE_COLAB_NOTEBOOK_URL`** in Vercel to the permanent GitHub-based Colab notebook URL:

```
VITE_COLAB_NOTEBOOK_URL=https://colab.research.google.com/github/itxunknown39-web/Image-To-Prompt/blob/main/colab/Image_to_Prompt_AI_Colab_T4.ipynb
```

> **Important:** This is the *notebook* URL, **not** the temporary API endpoint. The API endpoint is configured by the user in Settings and persists in `localStorage`. If this variable is not set, the frontend automatically uses the same canonical GitHub-based Colab URL as its default — no Google Drive URL is used anywhere in this workflow.

---

## Connecting the Frontend to Colab

1. Open the frontend website (on Vercel or locally).
2. Go to **Settings → AI Connection**.
3. Start the Colab notebook (see above).
4. Copy the API endpoint.
5. Paste it into the **API Endpoint** field.
6. Click **Save Endpoint**, then **Test Connection**.

If connected you'll see **● Connected**. The endpoint is saved in `localStorage` under the key `image_to_prompt_ai_endpoint` and is restored automatically on reload.

---

## API Reference

### `GET /health`

```json
{
  "status": "ok",
  "service": "image-to-prompt-ai",
  "ollama": true,
  "model": "gemma3:12b",
  "vision": true
}
```

### `POST /analyze-image`

`multipart/form-data` field `file`.

```json
{
  "success": true,
  "description": "Short accurate visual description.",
  "prompt": "Detailed professional image-generation prompt.",
  "keywords": ["keyword one", "keyword two"]
}
```

### `POST /analyze-images`

`multipart/form-data` field `files[]`. Processes sequentially.

```json
{
  "results": [
    { "filename": "image.jpg", "success": true, "description": "...", "prompt": "...", "keywords": [] }
  ]
}
```

---

## Environment Variables

See `frontend/.env.example`:

```
VITE_COLAB_NOTEBOOK_URL=https://colab.research.google.com/github/itxunknown39-web/Image-To-Prompt/blob/main/colab/Image_to_Prompt_AI_Colab_T4.ipynb
```

This variable is optional — the frontend defaults to the same canonical GitHub-based Colab URL if it is unset.

---

## Shutdown

- **Website**: No action required. It stays online on Vercel.
- **Colab**: Stop the runtime (**Runtime → Stop runtime**) to release the T4 GPU.
- When Colab is off, the website stays online but **AI shows Offline**. The frontend does not crash.

---

## Troubleshooting

### "No endpoint configured"
Go to **Settings → AI Connection** and paste the Cloudflare endpoint from Colab.

### "Server is offline"
Colab is not running, or the runtime disconnected. Re-open the notebook and Run all, then re-test.

### "AI took too long to respond"
The request exceeded the timeout. The T4 may be busy with another image, or the model is still loading. Try again.

### "Vision model failed"
The Gemma model may not be loaded. Re-run the notebook cells for model install and FastAPI, or reduce to the 4b fallback.

### "Unsupported image format"
Upload JPG, PNG, WEBP, or AVIF only, under 20 MB.

---

## Project Structure

```
image-to-prompt-ai/
├── frontend/                          # React + Vite (Vercel-deployed)
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/                # AppLayout (sidebar, header, bottom nav)
│   │   │   ├── upload/                # UploadZone, ImageQueueItem
│   │   │   ├── result/                # ResultCard
│   │   │   ├── settings/              # ConnectionSettings, ColabSetup, Preferences
│   │   │   └── ui/
│   │   ├── context/                   # ToastContext, ConnectionContext
│   │   ├── hooks/                     # useHistory
│   │   ├── pages/                     # Dashboard, ImageToPrompt, History, Settings
│   │   ├── services/                  # aiService
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── config.js
│   │   └── index.css
│   ├── index.html
│   ├── .env.example
│   └── package.json
├── backend/
│   └── main.py                        # FastAPI source (embedded in the notebook)
├── colab/
│   └── Image_to_Prompt_AI_Colab_T4.ipynb  # Ready-to-run Colab notebook
├── scripts/
│   ├── build_notebook.py              # Generates the Colab notebook from backend/main.py
│   └── deploy-build.js                # Cross-platform Vercel build orchestrator (builds frontend/)
├── package.json                       # Root Vercel build orchestration
├── vercel.json                        # Vercel root config (outputDirectory=frontend/dist + SPA rewrites)
├── .gitignore
├── PRD.md
└── README.md
```

---

## Important Personal-Use Limitations

- Colab runtime may disconnect after periods of inactivity.
- T4 GPU availability may vary.
- The temporary endpoint changes on every new Colab session.
- AI generation only works while Colab is running.
- The frontend remains online at all times on Vercel.
