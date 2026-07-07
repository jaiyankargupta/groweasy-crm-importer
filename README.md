# GrowEasy CRM — AI-Powered CSV Lead Importer

An intelligent CSV ingestion and schema mapping engine built for **GrowEasy CRM** ([groweasy.ai](https://groweasy.ai)).

Instead of relying on fragile manual column mapping or strict file formats, this application allows users to upload **any arbitrary CSV file** — whether from Facebook Lead Ads, Google Ads, Real Estate CRMs, or custom spreadsheet exports — and automatically extracts, cleans, and standardizes lead records into the GrowEasy CRM schema using **Groq LPU Inference (Llama 3 / Mixtral / Gemma)** or an offline rule-based heuristic engine.

---

## System Architecture

```
                        +---------------------------+
                        |      User's Browser       |
                        |   (Next.js 16 Frontend)   |
                        +---------------------------+
                                    |
                    Upload CSV / Confirm Extraction
                                    |
                                    v
                        +---------------------------+
                        |    Frontend (Port 3000)    |
                        |                           |
                        |  Step 1: Upload & Parse   |
                        |  Step 2: Preview Table    |
                        |  Step 3: Results & Export  |
                        +---------------------------+
                                    |
                        POST /api/upload (multipart)
                        POST /api/extract (JSON)
                        GET  /api/status/:jobId
                                    |
                                    v
                        +---------------------------+
                        |    Backend (Port 5001)     |
                        |    Express.js REST API     |
                        +---------------------------+
                        |   uploadMiddleware.js      |
                        |   importController.js      |
                        +---------------------------+
                                    |
                              csvParser.js
                          (csv-parse/sync engine)
                                    |
                                    v
                        +---------------------------+
                        |     aiService.js           |
                        |                           |
                        |  +---------+  +---------+ |
                        |  | Groq    |  | Heuris- | |
                        |  | LPU API |  | tic     | |
                        |  | (LLM)   |  | Engine  | |
                        |  +---------+  +---------+ |
                        |       |            |       |
                        |       v            v       |
                        |  cleanAndValidateRecord()  |
                        |  (7-Rule Normalization)    |
                        +---------------------------+
                                    |
                                    v
                        +---------------------------+
                        |   Structured JSON Output   |
                        |                           |
                        |  { records: [...],         |
                        |    skipped: [...] }         |
                        +---------------------------+
```

### Request Flow

1. **CSV Upload**: The user uploads a CSV file (drag-and-drop or file picker). The frontend sends it as multipart form data to `POST /api/upload`.
2. **Parsing**: The backend parses the raw CSV into an array of key-value row objects using `csv-parse/sync`. Column names are preserved exactly as they appear in the file — no assumptions are made about header naming.
3. **Preview**: The parsed rows and detected headers are returned to the frontend for tabular inspection. No AI processing occurs at this stage.
4. **Extraction**: When the user confirms, the frontend sends the parsed records to `POST /api/extract`. The backend chunks rows into configurable batches (default: 15 rows/batch) and routes each batch through either the Groq LLM or the offline heuristic engine.
5. **Normalization**: Every extracted record passes through `cleanAndValidateRecord()`, which enforces the 7-rule validation pipeline (status enums, source enums, date formatting, phone cleaning, multi-contact consolidation, and skip logic).
6. **Response**: The backend returns `{ records, skipped, totalImported, totalSkipped }` as structured JSON. The frontend renders the results in a tabbed interface with one-click JSON and CSV export.

---

## Key Features

1. **Groq LPU Intelligence**
   - Supports `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `mixtral-8x7b-32768`, and `gemma2-9b-it` on Groq's LPU hardware for sub-second structured JSON extraction.
   - Multi-model selection directly from the UI dropdown.
   - Automatic fallback to an offline semantic regex/heuristic parser if the API key is missing or rate limits are hit.

2. **3-Stage Workflow**
   - **Step 1 — Upload**: Drag-and-drop upload zone or one-click sample dataset testing with 4 pre-built test CSVs.
   - **Step 2 — Preview**: Sticky-header spreadsheet table for inspecting raw columns before any AI processing.
   - **Step 3 — Results**: Tabbed views for successfully mapped CRM records vs. skipped invalid rows, with JSON and GrowEasy CSV export.

3. **7-Rule Data Validation and Cleaning Engine**
   - **Rule 1 (Status Normalization)**: Maps irregular terms like `"Interested"`, `"Follow Up"`, `"No Answer"`, `"Unreachable"` into allowed enums: `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, `SALE_DONE`.
   - **Rule 2 (Source Validation)**: Enforces exact allowed values (`leads_on_demand`, `meridian_tower`, `eden_park`, `varah_swamy`, `sarjapur_plots`) or blanks out unknowns.
   - **Rule 3 and 4 (Date and Contact Cleaning)**: Normalizes timestamps to `YYYY-MM-DD HH:mm:ss` and strips non-numeric characters from phone numbers.
   - **Rule 5 (Multi-Contact Consolidation)**: Primary email/phone mapped to main fields; secondary contacts appended to `crm_note`.
   - **Rule 6 and 7 (Integrity and Skip)**: Escapes line breaks for CSV validity and skips rows missing both email and mobile number.

4. **Batch Processing with Retry**
   - Configurable batch size (default 15 records/batch).
   - Exponential backoff retry (up to 3 attempts) with automatic heuristic fallback.
   - Real-time progress indicator with percentage, batch counter, and elapsed timer.

---

## Tech Stack

| Layer     | Technology                                                        |
| :-------- | :---------------------------------------------------------------- |
| Frontend  | Next.js 16 (React 19, Turbopack), Vanilla CSS (custom dark theme)|
| Backend   | Node.js, Express.js, Multer, csv-parse/sync                      |
| AI        | Groq SDK (Llama 3.3, Mixtral, Gemma) + offline heuristic engine  |
| Testing   | Jest (13 automated tests)                                        |
| DevOps    | Docker, Docker Compose                                           |

---

## Project Structure

```
groweasy-crm-importer/
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── healthController.js    # Health check endpoint
│   │   │   └── importController.js    # Upload, extract, job status handlers
│   │   ├── middleware/
│   │   │   └── uploadMiddleware.js    # Multer config for CSV file uploads
│   │   ├── routes/
│   │   │   └── apiRoutes.js           # Express route definitions
│   │   ├── services/
│   │   │   └── aiService.js           # AI extraction, heuristic engine, 7-rule validator
│   │   ├── utils/
│   │   │   └── csvParser.js           # CSV parsing with csv-parse/sync
│   │   └── server.js                  # Express server entry point
│   ├── tests/
│   │   └── aiService.test.js          # Jest test suite (13 tests)
│   ├── .env.example                   # Environment variable template
│   ├── Dockerfile                     # Backend Docker image
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── globals.css            # Enterprise dark theme design system
│   │   │   ├── layout.js              # Root layout with metadata
│   │   │   └── page.js                # Main orchestrator (state machine)
│   │   └── components/
│   │       ├── Navbar.js              # Top navigation bar
│   │       ├── UploadStep.js          # Step 1: Upload zone + demo datasets
│   │       ├── PreviewStep.js         # Step 2: Scrollable data table
│   │       ├── ProgressBar.js         # Progress indicator during extraction
│   │       ├── ResultsStep.js         # Step 3: Results with export actions
│   │       └── StepIndicator.js       # Step progress breadcrumb
│   ├── Dockerfile                     # Multi-stage frontend Docker image
│   └── package.json
├── samples/
│   ├── groweasy_default_sample.csv    # Standard 4-row assignment sample
│   ├── facebook_lead_ads_sample.csv   # Irregular headers, invalid rows
│   ├── real_estate_crm_sample.csv     # Multi-email/phone consolidation test
│   └── master_all_test_cases.csv      # Comprehensive 7-rule edge case suite
├── docker-compose.yml                 # Full-stack orchestration
└── README.md
```

---

## Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/jaiyankargupta/groweasy-crm-importer.git
cd groweasy-crm-importer

# Set your Groq API key
export GROQ_API_KEY="your_groq_api_key_here"

# Build and start both services
docker compose up --build
```

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend API: [http://localhost:5001](http://localhost:5001)

### Option 2: Manual Local Setup

**Backend** (`/backend`):

```bash
cd backend
npm install
cp .env.example .env
# Edit .env and add your GROQ_API_KEY
npm start
```

**Frontend** (`/frontend`):

```bash
cd frontend
npm install
npm run dev
```

---

## Running Tests

The backend includes 13 automated Jest tests covering CSV parsing, all 7 normalization rules, heuristic fallback extraction, and Express API endpoints.

```bash
cd backend
npm test
```

Expected output:

```
PASS tests/aiService.test.js
  GrowEasy CSV Parser Utility
    - should correctly parse standard CSV string into records and headers
    - should handle messy CSVs with irregular quotes and spaces
    - should handle empty CSV input gracefully
    - should strip UTF-8 BOM if present at start of file
  GrowEasy AI Service Rules & Cleaning
    - Rule 1: should normalize CRM status values correctly
    - Rule 2: should normalize Data Source values to allowed enum or blank
    - Rule 5: should handle multiple emails and phone numbers
    - Rule 7: should skip records with neither email nor mobile number
  Heuristic AI Extraction Fallback
    - should extract CRM fields from Facebook Lead Export column names
  Express REST API Endpoints
    - GET /api/health should return ok status
    - POST /api/upload should parse CSV string in body
    - POST /api/extract should return structured JSON records
    - POST /api/upload should reject non-CSV files via multer filter

Tests: 13 passed, 13 total
```

---

## Sample Datasets

Four pre-configured test files are included in `/samples` and available as one-click cards in the UI:

| Dataset | Purpose |
| :------ | :------ |
| `groweasy_default_sample.csv` | Standard 4-row sample matching the assignment specification |
| `facebook_lead_ads_sample.csv` | Irregular headers, alt emails in notes, intentional invalid row |
| `real_estate_crm_sample.csv` | Multi-email and multi-phone columns for Rule 5 testing |
| `master_all_test_cases.csv` | Comprehensive 7-row suite covering all rules and edge cases |

---

## API Reference

### `GET /api/health`
Returns server status and configuration.

### `POST /api/upload`
Accepts a CSV file (multipart `file` field) or JSON body with `csvString`. Returns parsed headers and row objects.

### `POST /api/extract`
Accepts `{ records, provider, batchSize, jobId }`. Runs AI/heuristic extraction and returns `{ records, skipped, totalImported, totalSkipped }`.

### `GET /api/status/:jobId`
Returns the current progress of an ongoing extraction job.

---

## AI Strategy

### Why Groq LPU

Structured JSON extraction over dozens of rows requires fast token generation. Groq's LPU hardware generates tokens at 300+ tokens/second for Llama 3.3 70B, allowing a 15-row CSV batch to be mapped and validated in under 800ms.

### Prompt Engineering

The extraction prompt enforces:
- **Explicit field definitions**: All 15 target CRM fields with descriptions and examples.
- **Semantic mapping guidance**: Instructions for mapping domain-specific terms (e.g., `"Unreachable"` to `DID_NOT_CONNECT`, `"Deal Done"` to `SALE_DONE`).
- **Strict output format**: Uses `response_format: { type: 'json_object' }` to guarantee syntax-valid JSON without markdown pollution.

### Heuristic Fallback

When no API key is available or the LLM fails after 3 retries, the system automatically switches to `heuristicExtractRow()` — a regex-based semantic column matcher that maps common header patterns (`full_name`, `work_email`, `phone_number`, `lead_status`, etc.) to CRM fields with zero external dependencies.

---

## Environment Variables

| Variable | Default | Description |
| :------- | :------ | :---------- |
| `PORT` | `5001` | Backend server port |
| `AI_PROVIDER` | `groq` | AI provider (`groq`, `groq-llama-8b`, `groq-mixtral`, `groq-gemma`, `heuristic`) |
| `GROQ_API_KEY` | — | Your Groq API key |
| `GROQ_MODEL` | `llama-3.3-70b-versatile` | Default Groq model |
| `BATCH_SIZE` | `15` | Records per AI batch |
