# GrowEasy CRM — AI-Powered CSV Lead Importer

An enterprise-grade, intelligent CSV ingestion and schema mapping engine built for **GrowEasy CRM** ([groweasy.ai](https://groweasy.ai)). 

Instead of relying on fragile manual column mapping or strict file formats, this application allows users to upload **any arbitrary CSV file**—whether from Facebook Lead Ads, Google Ads, Real Estate CRMs, or custom spreadsheet exports—and automatically extracts, cleans, and standardizes lead records into the GrowEasy CRM schema using **Ultra-Fast Groq LPU Inference (Llama 3 / Mixtral / Gemma)** or an offline rule-based heuristic engine.

---

## 🌟 Key Features

1. **Groq LPU Intelligence**:
   - **Groq API Support**: Leverages `llama-3.3-70b-versatile`, `llama-3.1-8b-instant`, `mixtral-8x7b-32768`, and `gemma2-9b-it` on LPU hardware for sub-second structured JSON extraction.
   - **Multi-Model Selection**: Seamlessly switch between different Groq LPU models and **Offline Heuristics** directly from the UI dropdown.
   - **Intelligent Fallback**: If an API key is missing or rate limits occur, the system automatically falls back to an offline semantic regex/heuristic parser with zero downtime.

2. **Enterprise SaaS UI/UX**:
   - Built with Next.js 16 (App Router) and styled with a clean, professional dark slate design system.
   - **Zero Emojis**: Professional SVG iconography, subtle slate/indigo borders, and high-end typography (Inter).
   - **3-Stage Workflow**:
     - **Step 1: Ingestion** — Drag & drop upload or 1-click sample dataset testing.
     - **Step 2: Verification** — Sticky spreadsheet table inspection of raw arbitrary columns.
     - **Step 3: Analytics & Results** — Clean tabbed views for mapped CRM records vs. skipped invalid rows, with 1-click JSON and GrowEasy CSV export.

3. **Strict 7-Rule Data Validation & Cleaning Engine**:
   - **Rule 1 (Status Normalization)**: Standardizes irregular status terms (e.g., `"Interested"`, `"Follow Up"`, `"Good"`, `"No Answer"`, `"Unreachable"`) into allowed GrowEasy enums: `GOOD_LEAD_FOLLOW_UP`, `DID_NOT_CONNECT`, `BAD_LEAD`, or `SALE_DONE`.
   - **Rule 2 (Source Validation)**: Enforces exact allowed enum matching (`leads_on_demand`, `meridian_tower`, `eden_park`, `varah_swamy`, `sarjapur_plots`) or blanks out unknown values.
   - **Rule 3 & 4 (Date & Contact Cleaning)**: Standardizes ISO/timestamp strings to `YYYY-MM-DD HH:mm:ss` and strips non-numeric characters from phone numbers.
   - **Rule 5 (Multi-Contact Consolidation)**: When a row contains multiple emails or phone numbers, the primary contact is mapped to the main field, and secondary contacts are cleanly appended to `crm_note`.
   - **Rule 6 & 7 (Integrity & Skip Rules)**: Enforces string lengths and automatically skips rows missing *both* email and mobile number, logging exact reasons for auditing.

4. **Batch Processing & Progress Tracking**:
   - Chunks large CSV uploads into manageable batches (default: 15 records/batch).
   - Real-time progress indicator for visual feedback during processing.

---

## 🛠 Tech Stack

- **Frontend**: Next.js 16 (React 19, Turbopack), Vanilla CSS Variables (Enterprise SaaS Design System)
- **Backend**: Node.js, Express.js, Multer (Multipart upload), `csv-parse/sync`
- **AI SDKs**: `groq-sdk`
- **DevOps**: Docker, Docker Compose

---

## Quick Start & Installation

### Option 1: Docker Compose (Recommended)

Run the entire full-stack application with a single command:

```bash
# 1. Clone or navigate to the project directory
cd groweasy-importer

# 2. Add your Groq API key in docker-compose.yml (or export as env variable)
export GROQ_API_KEY="your_groq_api_key_here"

# 3. Start services
docker-compose up --build
```

- **Frontend Application**: [http://localhost:3000](http://localhost:3000)
- **Backend API Server**: [http://localhost:5001](http://localhost:5001)

---

### Option 2: Manual Local Setup

#### 1. Backend Setup (`/backend`)

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and add your GROQ_API_KEY

# Start API Server (runs on port 5001)
npm start
# For development with nodemon: npm run dev
```

#### 2. Frontend Setup (`/frontend`)

```bash
cd frontend

# Install dependencies
npm install

# Start Next.js Development Server (runs on port 3000)
npm run dev
```

---

## 🧪 Running Automated Tests

The backend includes a comprehensive Jest test suite verifying CSV parsing, AI prompt formatting, normalization rules (Rule 1–7), multi-contact consolidation, heuristic fallback, and Express REST endpoints.

```bash
cd backend
npm test
```

---

## 📂 Sample Datasets for Testing

In the `/samples` directory (and available via 1-click dropdown in the UI), you will find three pre-configured test files:
1. `groweasy_default_sample.csv`: Standard expected assignment structure.
2. `facebook_lead_ads_sample.csv`: Irregular headers (`submission_time`, `work_email`, `phone_number`), alt emails in notes, and intentional invalid rows without contact details.
3. `real_estate_crm_sample.csv`: Multi-column secondary emails and alt phones to test Rule 5 consolidation and date formatting.

---

## 🧠 Architecture & AI Strategy

### Why Groq LPU Inference?
Structured JSON extraction over dozens of rows requires fast token generation. Groq's LPU hardware generates tokens at ~300+ T/s for Llama 3.3 70B, allowing a 15-row CSV batch to be mapped and validated in under 800ms.

### The AI Extraction Prompt
When an LLM provider is invoked, the server sends a strict, schema-enforcing prompt:
- **System Role**: Defines the assistant as an expert CRM data extractor for GrowEasy.
- **Field Definitions**: Explicitly lists all 15 target fields (`created_at`, `name`, `email`, `country_code`, `mobile_without_country_code`, `company`, `city`, `state`, `country`, `lead_owner`, `crm_status`, `crm_note`, `data_source`, `possession_time`, `description`).
- **Semantic Mapping Guidance**: Instructs the model on how to map domain-specific terms (e.g., mapping `"Unreachable"` or `"Called twice, no response"` to `DID_NOT_CONNECT`).
- **Output Format**: Enforces `response_format: { type: 'json_object' }` to guarantee syntax-valid JSON arrays without markdown pollution.

---

## 📝 Submission Details

- **Candidate**: Jaiyankar Gupta
- **Position**: Software Developer (Full-Time / Intern)
- **Email**: Submitted to `varun@groweasy.ai`
