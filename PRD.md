Product Requirements Document (PRD)
Image to Prompt AI

Version: 1.0
Product Type: Personal AI Image Analysis & Prompt Generator
Primary Use: Convert uploaded images into detailed, professional AI image-generation prompts
Frontend: React / Vite
Frontend Hosting: Vercel
AI Runtime: Google Colab NVIDIA T4
AI Engine: Ollama
Vision Model: Gemma 3 12B
API Layer: FastAPI
Public Tunnel: Cloudflare Quick Tunnel
Database: None
Authentication: None
Paid AI APIs: None

1. Product Vision

Image to Prompt AI is a professional, lightweight web application designed to analyze an uploaded image using a local/open-source vision model running on a temporary Google Colab NVIDIA T4 GPU and convert the visual information into a high-quality, detailed AI image-generation prompt.

The application separates the permanent frontend from the temporary AI server:

                    IMAGE TO PROMPT AI

             ┌──────────────────────────┐
             │        VERCEL            │
             │                          │
             │   React Frontend         │
             │                          │
             │ Upload → Analyze → Result│
             └────────────┬─────────────┘
                          │
                       HTTPS
                          │
                          ▼
             ┌──────────────────────────┐
             │   CLOUDFLARE TUNNEL      │
             │   Temporary HTTPS URL    │
             └────────────┬─────────────┘
                          │
                          ▼
             ┌──────────────────────────┐
             │      GOOGLE COLAB        │
             │       NVIDIA T4          │
             │                          │
             │ FastAPI                  │
             │    ↓                     │
             │ Ollama                   │
             │    ↓                     │
             │ Gemma 3 Vision           │
             └──────────────────────────┘

The product is specifically optimized for personal use, so there is no unnecessary database, authentication, payment, or cloud infrastructure.

2. Product Objective

The main objective is:

Upload an image → analyze its visual content → generate a professional, detailed prompt that can be reused with AI image-generation tools.

The application should provide a much more useful output than a basic image caption.

It should understand:

Subject
Objects
Environment
Composition
Camera angle
Perspective
Lighting
Shadows
Colors
Materials
Textures
Background
Depth
Photography style
Illustration style
Commercial visual characteristics
3. Core User Flow

The complete workflow must be extremely simple.

Initial setup
Deploy frontend to Vercel
        ↓
Open saved Google Colab notebook
        ↓
Select NVIDIA T4
        ↓
Run All
        ↓
Ollama starts
        ↓
Gemma 3 downloads/loads
        ↓
FastAPI starts
        ↓
Cloudflare Tunnel starts
        ↓
Public API endpoint appears

Example:

https://abc123.trycloudflare.com

User copies this URL.

Then:

Image to Prompt AI
        ↓
Settings
        ↓
AI Connection
        ↓
Paste endpoint
        ↓
Save
        ↓
Test Connection
        ↓
Connected

After that:

Upload Image
      ↓
Generate Prompt
      ↓
Colab T4
      ↓
Gemma Vision
      ↓
Prompt
      ↓
Result
4. Product Scope
MVP — Included
Frontend
Dashboard
Image upload
Drag & drop
Multiple image upload
Image preview
Image-to-prompt generation
Result cards
Prompt copy
Prompt download
Redo generation
Processing status
Connection status
Settings
Colab setup instructions
Endpoint configuration
LocalStorage persistence
Local history
Responsive design
Vercel deployment
Backend
FastAPI
Ollama integration
Gemma Vision integration
Image validation
Temporary image storage
Prompt generation
JSON response
Health endpoint
CORS
Error handling
Multiple image processing
Colab
T4 detection
Ollama installation
Ollama startup
Model installation
FastAPI startup
Cloudflare tunnel
Public endpoint detection
Health verification
Diagnostic output
5. Explicitly Out of Scope

Do NOT implement:

Gemini API
OpenAI API
Claude API
Supabase
Firebase
PostgreSQL
MongoDB
OAuth
User accounts
Payments
Subscription system
Admin dashboard
VPS
Docker requirement
Production GPU infrastructure
API marketplace
Team collaboration

This is a personal-use application.

6. Technology Stack
Frontend

Recommended:

React
Vite
JavaScript / TypeScript
CSS / Tailwind CSS

The frontend must remain completely independent from the AI runtime.

AI Server
Python
FastAPI
Uvicorn
Ollama
Gemma 3 Vision
GPU
Google Colab
NVIDIA Tesla T4
Public Connectivity
Cloudflare Quick Tunnel
7. AI Model

Default:

Gemma 3 12B

Ollama model identifier:

gemma3:12b

Optional fallback:

gemma3:4b

The frontend should display:

AI MODEL

Gemma 3 12B

and:

AI ENGINE

Ollama
8. Frontend Information Architecture
Image to Prompt AI
│
├── Dashboard
│
├── Image → Prompt
│
├── History
│
└── Settings
    │
    ├── AI Connection
    ├── Colab Setup
    └── Preferences
9. Dashboard

The dashboard should provide a quick overview.

Example:

IMAGE TO PROMPT AI

Transform any image into a professional
AI-ready prompt.

[ Upload Image ]

────────────────────────────

AI STATUS

● Connected

Model
Gemma 3 12B

GPU
NVIDIA T4

Engine
Ollama

Quick actions:

[ Image → Prompt ]
[ View History ]
[ AI Settings ]
10. Main Image → Prompt Workspace

This is the primary screen.

Header
IMAGE → PROMPT

Upload an image and generate a detailed,
professional AI image-generation prompt.
11. Upload Zone

Large drag-and-drop area:

┌──────────────────────────────────────────────┐
│                                              │
│                     ↑                        │
│                                              │
│             Drop your images here            │
│                                              │
│          or click to browse files             │
│                                              │
│        JPG • PNG • WEBP • AVIF               │
│                                              │
└──────────────────────────────────────────────┘

Supported:

.jpg
.jpeg
.png
.webp
.avif

Maximum size:

20 MB / image
12. Image Queue

After upload:

SELECTED IMAGES

┌───────────┐
│           │
│  Preview  │
│           │
└───────────┘
image-01.jpg
2.4 MB
✓ Ready

Each image includes:

Preview
Filename
File size
Remove button
Processing state
13. Processing States

Each image should have one of:

WAITING
ANALYZING
GENERATING
COMPLETED
FAILED

Example:

image-01.jpg

● Analyzing image...

Multiple images:

Processing 3 of 8
14. Generate Prompt CTA

Primary button:

✨ Generate Prompt

When processing:

⟳ Analyzing...

Button should be disabled while the specific request is processing.

15. Result Card

Each image gets a dedicated result.

┌─────────────────────────────────────────────┐
│                                             │
│              IMAGE PREVIEW                  │
│                                             │
├─────────────────────────────────────────────┤
│ image-01.jpg                                │
│                                             │
│ GEMMA 3 12B  •  OLLAMA  •  T4              │
├─────────────────────────────────────────────┤
│                                             │
│ GENERATED PROMPT                            │
│                                             │
│ A high-resolution commercial photograph...  │
│                                             │
│                                             │
├─────────────────────────────────────────────┤
│ [ Copy ] [ Redo ] [ Download ]              │
└─────────────────────────────────────────────┘
16. Prompt Output

The generated prompt should normally be:

100–180 words

It should be:

Detailed
Natural
Visually accurate
Professional
AI-generation friendly
Commercially useful

The AI should not simply list objects.

It should create a coherent prompt.

17. Description Output

Optional expandable section:

DESCRIPTION

A professional commercial photograph showing...

Description should be shorter than the main prompt.

18. Keywords

Generate approximately:

15–25 keywords

Example:

strawberry
fresh fruit
basket
food
healthy eating
organic
natural
fresh produce
commercial photography

Keywords should describe only the visible subject.

19. Result Actions
Copy

Copies only the prompt.

Toast:

✓ Prompt copied to clipboard
Redo

Sends the image again.

Download

Downloads:

image-01-prompt.txt

Optionally:

image-01.json
20. AI Connection Settings

This is a core feature.

AI CONNECTION
──────────────────────────────

ENGINE
Ollama

MODEL
Gemma 3 12B

GPU
NVIDIA T4

API ENDPOINT

┌──────────────────────────────┐
│ https://xxxxx.trycloudflare  │
└──────────────────────────────┘

[ Save Endpoint ]

[ Test Connection ]

STATUS
● Connected
21. Endpoint Persistence

The endpoint must be saved in:

localStorage

Key:

image_to_prompt_ai_endpoint

When the website reloads, the saved endpoint should automatically be loaded.

22. Important Endpoint Behavior

The frontend must NOT hard-code the Cloudflare API URL.

Reason:

Cloudflare Quick Tunnel URLs are temporary.

Example:

Session 1
https://abc.trycloudflare.com

Session 2
https://xyz.trycloudflare.com

Therefore:

Colab Notebook URL
=
Permanent setup link

API Endpoint
=
Temporary runtime URL

These must be treated separately.

23. Colab Connection Guide

Inside Settings:

HOW TO CONNECT COLAB
Step 1
Open the Image to Prompt AI Google Colab notebook
(version-controlled in GitHub, loaded via the permanent GitHub-based Colab URL).

Button:

[ Open Colab Notebook ↗ ]

The frontend should have a configurable constant:

COLAB_NOTEBOOK_URL

It defaults to the canonical GitHub-based Colab URL:
https://colab.research.google.com/github/itxunknown39-web/Image-To-Prompt/blob/main/colab/Image_to_Prompt_AI_Colab_T4.ipynb
Step 2
Select:

Runtime
→ Change runtime type
→ NVIDIA T4 GPU
Step 3
Click:

Runtime
→ Run all

The notebook automatically performs all setup.

Step 4

Wait for:

IMAGE TO PROMPT AI SERVER READY
Step 5

Copy:

https://xxxxx.trycloudflare.com
Step 6

Return to:

Settings
→ AI Connection

Paste the URL.

Click:

Test Connection
24. Connection Success UI
✓ CONNECTION SUCCESSFUL

AI Server
Online

Ollama
Online

Vision Model
Gemma 3 12B

GPU
NVIDIA T4
25. Connection Failure UI
✕ CONNECTION FAILED

Unable to reach your Colab AI server.

Please make sure:

1. Colab is running
2. T4 GPU is enabled
3. Notebook was executed
4. API endpoint is correct

[ Retry ]
[ Setup Guide ]
26. Colab Notebook

The notebook is a first-class project deliverable.

File:

Image_to_Prompt_AI_Colab_T4.ipynb

It must be ready to upload/open in Google Colab.

The user should not need to manually create backend files.

27. Notebook Run-All Requirement

The most important notebook requirement:

The notebook must be designed for Run All execution.

The user should not need to manually:

Open terminal
Install packages one by one
Start Ollama manually
Create FastAPI files manually
Start Uvicorn manually
Start Cloudflare manually
Copy complicated commands

Everything should be automated.

28. Notebook Sections
01. Welcome & Configuration
02. GPU Verification
03. Install Dependencies
04. Install Ollama
05. Start Ollama
06. Install / Verify Gemma
07. Create FastAPI Server
08. Start FastAPI
09. Start Cloudflare Tunnel
10. Verify Public Endpoint
11. Display Connection Information
12. API Test
13. Troubleshooting
29. Notebook Welcome Cell

Display:

╔══════════════════════════════════════════════╗
║        IMAGE TO PROMPT AI                    ║
║        COLAB T4 AI SERVER                    ║
╠══════════════════════════════════════════════╣
║                                              ║
║ AI Engine: Ollama                            ║
║ Vision Model: Gemma 3 12B                    ║
║ GPU: NVIDIA T4                               ║
║ API: FastAPI                                 ║
║ Tunnel: Cloudflare                           ║
║                                              ║
║ Run all cells to start the server.           ║
╚══════════════════════════════════════════════╝
30. GPU Verification

The notebook must verify:

NVIDIA GPU detected
CUDA available
VRAM
GPU name

If T4 isn't detected:

ERROR

NVIDIA T4 GPU was not detected.

Please select:
Runtime → Change runtime type → T4 GPU
31. Ollama Installation

Automatically:

Check Ollama
       ↓
Already installed?
   YES → Continue
   NO  → Install

No unnecessary repeated installation.

32. Ollama Startup

Start:

Ollama server

Default internal address:

127.0.0.1:11434

Verify it is responding.

33. Model Verification

Check:

gemma3:12b

If missing:

ollama pull gemma3:12b

If already present:

Model already installed.
34. FastAPI Service

FastAPI should run on:

0.0.0.0:8000

Required routes:

GET  /
GET  /health
POST /analyze-image
POST /analyze-images
35. Health Endpoint

Example:

{
  "status": "ok",
  "service": "image-to-prompt-ai",
  "ollama": true,
  "model": "gemma3:12b",
  "vision": true
}
36. Image Analysis Endpoint

Endpoint:

POST /analyze-image

Input:

multipart/form-data

Field:

file

Backend workflow:

Receive Image
      ↓
Validate MIME Type
      ↓
Validate File Size
      ↓
Temporary File
      ↓
Ollama Vision
      ↓
Gemma 3
      ↓
Parse JSON
      ↓
Return Response
      ↓
Delete Temporary File
37. Multiple Image Endpoint

Endpoint:

POST /analyze-images

Input:

files[]

For MVP, process sequentially:

Image 1
 ↓
Gemma
 ↓
Result

Image 2
 ↓
Gemma
 ↓
Result

This avoids unnecessary T4 VRAM pressure.

38. AI System Prompt

The backend must use a carefully designed system prompt.

The model is instructed to behave as:

Professional visual analyst
+
Commercial stock-image specialist
+
AI image prompt engineer

It must inspect:

Subject
Objects
Environment
Background
Composition
Framing
Camera angle
Perspective
Lighting
Shadows
Colors
Materials
Textures
Depth
Visual style
Photography characteristics
Commercial qualities
39. AI Hallucination Rules

The model MUST NOT:

Invent objects
Invent people
Invent locations
Invent brands
Invent logos
Invent products
Invent actions
Invent environmental details

It should only use information reasonably visible in the image.

40. AI Response Format

The model must return JSON:

{
  "description": "Short accurate visual description.",
  "prompt": "Detailed professional image-generation prompt.",
  "keywords": [
    "keyword one",
    "keyword two",
    "keyword three"
  ]
}

Backend must validate the JSON before returning it.

If invalid JSON is received, the backend should gracefully recover and return a safe response rather than crash.

41. File Validation

Allowed:

image/jpeg
image/png
image/webp
image/avif

Maximum:

20 MB

Invalid uploads should receive:

{
  "success": false,
  "error": "Unsupported image format."
}
42. Temporary Storage

Uploaded images must be temporary.

Upload
 ↓
Temporary file
 ↓
Analyze
 ↓
Return result
 ↓
Delete file

No permanent image storage is required.

43. CORS

FastAPI must support Vercel requests.

For personal use:

allow_origins=["*"]

is acceptable for the initial version.

Make it configurable so it can later be restricted to the Vercel domain.

44. Cloudflare Tunnel

The notebook must automatically expose:

localhost:8000

through a temporary HTTPS tunnel.

Example:

https://abc123.trycloudflare.com

The notebook must automatically detect the generated URL.

45. Public Endpoint Verification

Do NOT simply display the tunnel URL.

First verify:

Public URL
 ↓
/health
 ↓
HTTP 200

Only then display:

SERVER READY

This is essential for reliability.

46. Final Notebook Output

The final cell should display a professional status panel:

╔══════════════════════════════════════════════╗
║        IMAGE TO PROMPT AI — READY            ║
╠══════════════════════════════════════════════╣
║                                              ║
║ GPU             NVIDIA T4                    ║
║ Ollama          ● ONLINE                     ║
║ Model           Gemma 3 12B                  ║
║ FastAPI         ● ONLINE                     ║
║ Tunnel          ● ONLINE                     ║
║                                              ║
║ API ENDPOINT                                   ║
║                                              ║
║ https://xxxxxxxx.trycloudflare.com           ║
║                                              ║
║ Copy this URL into the website Settings.     ║
║                                              ║
╚══════════════════════════════════════════════╝

Also provide a clickable copy mechanism if possible.

47. Notebook Idempotency

Running cells multiple times should not break the environment.

The notebook should detect:

Ollama already installed
Ollama already running
Model already downloaded
FastAPI already running
Old tunnel process

It should cleanly handle these situations.

48. Automatic Diagnostics

Startup should show:

[1/8] GPU ................. ✓
[2/8] Ollama .............. ✓
[3/8] Model ............... ✓
[4/8] Dependencies ........ ✓
[5/8] FastAPI ............. ✓
[6/8] Tunnel .............. ✓
[7/8] Public API .......... ✓
[8/8] Health Check ........ ✓

If anything fails, show:

FAILED

Component:
Ollama

Reason:
...

Suggested fix:
...
49. Frontend API Service

Frontend should have a dedicated service:

src/services/aiService.js

Functions:

checkConnection()
analyzeImage(file)
analyzeImages(files)

Never put API logic directly into UI components.

50. API Configuration

Frontend reads:

localStorage

Example:

image_to_prompt_ai_endpoint

The frontend must normalize the endpoint:

https://abc.trycloudflare.com

and prevent accidental:

https://abc.trycloudflare.com/

double-slash API URLs.

51. Frontend Error Handling
Endpoint missing
AI endpoint not configured.
Go to Settings → AI Connection.
Server offline
Colab AI server is offline.
Open the Colab notebook and run it.
Timeout
The AI server took too long to respond.
Please try again.
Model error
Vision model failed to analyze the image.
Invalid image
Please upload a supported image.
52. History

History is local only.

Storage:

localStorage

No database.

Each record:

{
  "id": "unique-id",
  "filename": "image.jpg",
  "timestamp": "2026-09-01T10:00:00Z",
  "description": "...",
  "prompt": "...",
  "keywords": []
}

Maximum:

50 results
53. History UI
HISTORY

┌─────────────────────────────────────┐
│ image-01.jpg                        │
│ Sep 1, 2026                         │
│                                     │
│ A professional commercial...        │
│                                     │
│ [ View ] [ Copy ] [ Delete ]        │
└─────────────────────────────────────┘
54. Responsive Design

Desktop:

Sidebar
+
Main Workspace

Tablet:

Collapsible Sidebar
+
Workspace

Mobile:

Top Header
+
Workspace
+
Bottom Navigation

All controls must remain touch-friendly.

55. Visual Design Direction

The application should feel like a modern professional AI SaaS.

Design characteristics:

Clean
Minimal
Premium
High contrast
Excellent spacing
Subtle borders
Soft cards
Clear typography
Smooth animations
No unnecessary gradients
No excessive decoration

The UI should prioritize usability over visual gimmicks.

56. Connection Indicator

Global header:

AI ● Connected

or:

AI ● Offline

Clicking it should take the user to:

Settings → AI Connection
57. Vercel Deployment Requirements

The frontend must work with:

npm install
npm run dev
npm run build

The final production build must have:

0 build errors

No dependency on the Colab filesystem.

No Python required for frontend.

58. Environment Variables

Frontend may use:

VITE_COLAB_NOTEBOOK_URL

This should contain the GitHub-based notebook URL. The default is:

https://colab.research.google.com/github/itxunknown39-web/Image-To-Prompt/blob/main/colab/Image_to_Prompt_AI_Colab_T4.ipynb

Example:

VITE_COLAB_NOTEBOOK_URL=<YOUR_COLAB_NOTEBOOK_URL>

Important:

This is not the temporary API endpoint.

The API endpoint remains user-configurable through Settings.

59. README

The project must include a professional README containing:

Project overview
Features
Architecture
Local development
Vercel deployment
Colab setup
T4 setup
Ollama setup
Model setup
Endpoint connection
Troubleshooting
Shutdown instructions
60. User Documentation

The frontend itself must contain instructions so the user doesn't need to constantly refer to external documentation.

Example:

CONNECT YOUR AI SERVER

1. Open the Colab notebook.
2. Select T4 GPU.
3. Run All.
4. Wait for SERVER READY.
5. Copy the API endpoint.
6. Paste it above.
7. Click Test Connection.
61. Shutdown Workflow

After finishing:

Website
  ↓
No action required

Colab
  ↓
Stop runtime
  ↓
T4 released

Frontend remains deployed on Vercel.

When Colab is off:

Website → Online
AI → Offline

The frontend must not crash.

62. Important Personal-Use Limitation

The architecture intentionally uses:

Google Colab
+
Quick Tunnel

Therefore:

Colab runtime may disconnect.
T4 availability may vary.
Temporary endpoint may change.
AI won't work while Colab is stopped.
Frontend remains online.

This behavior should be clearly communicated in Settings.

63. Security

No API keys are required.

Optional future security:

Bearer token

can be added later.

For MVP:

No authentication

because this is personal use.

64. Performance Requirements

Frontend should remain responsive while AI is processing.

The UI must:

Never freeze.
Show progress.
Allow other UI navigation.
Display completed results immediately.
Process multiple images safely.

Recommended MVP behavior:

Image 1 → Process
Image 2 → Queue
Image 3 → Queue

rather than sending many simultaneous vision requests to the T4.

65. Accessibility

The frontend should include:

Keyboard navigation
Accessible buttons
Visible focus states
Proper labels
Alt text for previews
Sufficient contrast
Screen-reader-friendly status messages
66. Project Deliverables

The developer must deliver:

Deliverable 1

Complete Image to Prompt AI frontend

Vercel-ready
Deliverable 2

Complete Google Colab notebook

Image_to_Prompt_AI_Colab_T4.ipynb
Deliverable 3

README

Complete setup + connection guide
Deliverable 4
.env.example
Deliverable 5

Clean project structure.

67. Definition of Done

The project is complete only when this entire sequence works:

                 USER

                   │
                   ▼

          Open Vercel Website
                   │
                   ▼
           Open Settings
                   │
                   ▼
          Open Colab Notebook
                   │
                   ▼
              Select T4
                   │
                   ▼
               Run All
                   │
                   ▼
        Ollama + Gemma 3
                   │
                   ▼
             FastAPI
                   │
                   ▼
          Cloudflare Tunnel
                   │
                   ▼
          Public HTTPS URL
                   │
                   ▼
          Copy API Endpoint
                   │
                   ▼
         Paste into Website
                   │
                   ▼
          Test Connection
                   │
                   ▼
             ● CONNECTED
                   │
                   ▼
            Upload Image
                   │
                   ▼
         Generate Prompt
                   │
                   ▼
            Colab T4 GPU
                   │
                   ▼
          Gemma Vision AI
                   │
                   ▼
          Structured JSON
                   │
                   ▼
           Result Card
                   │
                   ▼
        Copy / Redo / Download
68. Non-Negotiable Technical Requirements

The implementation MUST satisfy all of the following:

No Gemini API.
No paid AI API.
Ollama must perform inference.
Gemma 3 Vision must receive the uploaded image.
GPU inference must occur inside Google Colab T4.
FastAPI must act as the API layer.
Frontend must communicate with FastAPI, not directly with Ollama.
Cloudflare must provide temporary HTTPS access.
Colab notebook must be reusable.
User must not need to upload/create backend files manually every session.
Notebook must support Run All.
Frontend must save endpoint locally.
Frontend must provide a Colab setup guide.
Frontend must provide a direct configurable Colab notebook link.
Public endpoint must be health-checked before being marked ready.
Temporary uploaded images must be deleted after processing.
Frontend must work independently when Colab is offline.
Vercel deployment must succeed without Python/backend dependencies.
All API failures must produce user-friendly messages.
The final implementation must be tested end-to-end.
69. Final Product Positioning

Image to Prompt AI should feel like a focused professional utility rather than a large complicated SaaS.

Core promise:

Upload an image. Understand its visual structure. Generate a professional AI prompt.

Architecture:
        IMAGE TO PROMPT AI
                 │
        ┌────────┴────────┐
        │                 │
     FRONTEND           AI ENGINE
     Vercel             Colab T4
        │                 │
        │              Ollama
        │                 │
        │            Gemma 3 Vision
        │                 │
        └──── HTTPS ──────┘

Vercel = permanent frontend.
Colab T4 = temporary AI engine.
Ollama = AI runtime.
Gemma 3 = vision model.
FastAPI = bridge.
Cloudflare Tunnel = temporary public connection.