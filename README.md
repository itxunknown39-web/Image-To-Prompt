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

The AI backend is provided as a ready-to-run notebook. You do **not** need to create backend files manually.

1. Open `colab/Image_to_Prompt_AI_Colab_T4.ipynb` (upload it to Google Drive).
2. Open it in **Google Colab** (double-click the file, or `colab.research.google.com` → File → Upload notebook).
3. Select **Runtime → Change runtime type → NVIDIA T4 GPU**.
4. Click **Runtime → Run all**.
5. Wait for the **IMAGE TO PROMPT AI — READY** status panel.
6. Copy the **API Endpoint** (e.g. `https://xxxxx.trycloudflare.com`).
7. Paste it into the website at **Settings → AI Connection**.

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

```bash
cd frontend
npm install
npm run build
```

Deploy the `frontend` directory to Vercel (e.g. via `vercel` CLI or the Vercel dashboard, building from `frontend/` with build command `npm run build` and output `dist`).

### Environment variables

Set **`VITE_COLAB_NOTEBOOK_URL`** in Vercel to your permanent saved Colab notebook URL:

```
VITE_COLAB_NOTEBOOK_URL=https://colab.research.google.com/drive/1XXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

> **Important:** This is the *permanent notebook* URL, **not** the temporary API endpoint. The API endpoint is configured by the user in Settings and persists in `localStorage`.

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
VITE_COLAB_NOTEBOOK_URL=
```

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
│   └── build_notebook.py              # Generates the Colab notebook from backend/main.py
└── README.md
```

---

## Important Personal-Use Limitations

- Colab runtime may disconnect after periods of inactivity.
- T4 GPU availability may vary.
- The temporary endpoint changes on every new Colab session.
- AI generation only works while Colab is running.
- The frontend remains online at all times on Vercel.
