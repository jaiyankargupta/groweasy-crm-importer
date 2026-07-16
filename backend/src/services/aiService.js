const Groq = require('groq-sdk');

const ALLOWED_STATUSES = ['GOOD_LEAD_FOLLOW_UP', 'DID_NOT_CONNECT', 'BAD_LEAD', 'SALE_DONE'];
const ALLOWED_SOURCES = ['leads_on_demand', 'meridian_tower', 'eden_park', 'varah_swamy', 'sarjapur_plots'];

async function extractCRMData(records, options = {}) {
  const provider = options.provider || process.env.AI_PROVIDER || 'groq';
  const batchSize = Math.min(Math.max(options.batchSize || parseInt(process.env.BATCH_SIZE || '15', 10), 1), 100);
  const onProgress = options.onProgress || (() => { });

  const totalRows = records.length;
  const batches = [];

  for (let i = 0; i < totalRows; i += batchSize) {
    batches.push(records.slice(i, i + batchSize));
  }

  const parsedRecords = [];
  const skippedRecords = [];
  let processedRows = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    let batchResults = null;

    try {
      batchResults = await executeWithRetry(() => callAIExtraction(batch, provider), 3, 1000);
    } catch (error) {
      if (process.env.NODE_ENV !== 'test') {
        console.warn(`[AIService] Batch ${i + 1} failed (${error.message}). Falling back to heuristic mapping.`);
      }
      batchResults = batch.map(row => heuristicExtractRow(row));
    }

    for (let j = 0; j < batch.length; j++) {
      const rawRow = batch[j];
      const extracted = batchResults[j] || {};
      const cleaned = cleanAndValidateRecord(extracted, rawRow);

      if (cleaned.isValid) {
        parsedRecords.push(cleaned.record);
      } else {
        skippedRecords.push({
          rawRow,
          reason: cleaned.reason
        });
      }
    }

    processedRows += batch.length;
    onProgress({
      batchIndex: i + 1,
      totalBatches: batches.length,
      processedRows,
      totalRows,
      percentage: Math.round((processedRows / totalRows) * 100),
      status: 'processing'
    });
  }

  onProgress({
    batchIndex: batches.length,
    totalBatches: batches.length,
    processedRows: totalRows,
    totalRows,
    percentage: 100,
    status: 'completed'
  });

  return {
    success: true,
    parsedRecords,
    skippedRecords,
    totalImported: parsedRecords.length,
    totalSkipped: skippedRecords.length
  };
}

async function executeWithRetry(fn, maxRetries = 3, delayMs = 1000) {
  let lastError;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (err.status === 401 || err.status === 403 || (err.message && err.message.toLowerCase().includes('api key'))) {
        throw err;
      }
      if (attempt < maxRetries) {
        const waitTime = delayMs * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }
  throw lastError;
}

async function callAIExtraction(batchRows, provider) {
  let activeProvider = provider || 'groq';
  if (activeProvider === 'auto') activeProvider = 'groq';

  if (activeProvider === 'heuristic') {
    return batchRows.map(row => heuristicExtractRow(row));
  }

  const prompt = buildPrompt(batchRows);

  let modelName = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';
  if (activeProvider === 'groq-llama-8b') modelName = 'llama-3.1-8b-instant';
  else if (activeProvider === 'groq-mixtral') modelName = 'mixtral-8x7b-32768';
  else if (activeProvider === 'groq-gemma') modelName = 'gemma2-9b-it';

  return await callGroq(prompt, batchRows.length, modelName);
}

function buildPrompt(batchRows) {
  return `You are an expert AI data extraction assistant for GrowEasy CRM.
Your task is to analyze the following JSON array of raw CSV rows and extract/map them into standard GrowEasy CRM fields.

Required fields for each record:
- created_at: Lead creation date (must be a valid date convertible by new Date(), e.g. "2026-05-13 14:20:48")
- name: Lead full name
- email: Primary email address
- country_code: Country code (e.g. "+91", "+1")
- mobile_without_country_code: Mobile number without country code
- company: Company or organization name
- city: City
- state: State or province
- country: Country
- lead_owner: Email or name of assigned lead owner/agent
- crm_status: MUST be EXACTLY one of: "GOOD_LEAD_FOLLOW_UP", "DID_NOT_CONNECT", "BAD_LEAD", "SALE_DONE". Map related terms intelligently (e.g., "Interested"/"Follow Up"/"Good" -> GOOD_LEAD_FOLLOW_UP; "No Answer"/"Busy"/"Unreachable" -> DID_NOT_CONNECT; "Not Interested"/"Invalid"/"Bad" -> BAD_LEAD; "Closed"/"Won"/"Deal Done" -> SALE_DONE).
- crm_note: Notes, remarks, questions, follow-up notes, or any extra information. IMPORTANT: If multiple email addresses exist in the row, put the first in 'email' and append the remaining emails into crm_note. If multiple phone numbers exist, put the first in 'mobile_without_country_code' and append the remaining phone numbers into crm_note.
- data_source: MUST be EXACTLY one of: "leads_on_demand", "meridian_tower", "eden_park", "varah_swamy", "sarjapur_plots". If none match confidently, leave it blank "".
- possession_time: Property possession time (e.g., "Immediate", "Dec 2026")
- description: Additional description or specifications (e.g. budget, project details)

Rules:
1. Return ONLY a JSON object with a single key "records" containing an array of extracted objects matching the exact length and order of the input rows.
2. Do not introduce raw unescaped line breaks. Use "\\n" if line breaks are needed in crm_note or description.

Input Raw Rows:
${JSON.stringify(batchRows, null, 2)}`;
}

async function callGroq(prompt, expectedLength, modelOverride) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not set');

  const groq = new Groq({ apiKey });
  const modelName = modelOverride || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  const response = await groq.chat.completions.create({
    model: modelName,
    messages: [
      { role: 'system', content: 'You are an expert AI data extraction assistant for GrowEasy CRM. Output strict JSON only.' },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' },
    temperature: 0.1
  });

  const text = response.choices[0]?.message?.content || '{}';
  return parseAIResponseJSON(text, expectedLength);
}

function parseAIResponseJSON(text, expectedLength) {
  try {
    const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleaned);
    if (data && Array.isArray(data.records)) {
      return data.records;
    }
    if (Array.isArray(data)) {
      return data;
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('[AIService] Failed to parse JSON response:', err.message);
    }
  }
  return new Array(expectedLength).fill({});
}

function heuristicExtractRow(row) {
  const keys = Object.keys(row);
  const findVal = (regexes) => {
    for (const k of keys) {
      if (regexes.some(r => r.test(k))) {
        return row[k] ? String(row[k]).trim() : '';
      }
    }
    return '';
  };

  const name = findVal([/name/i, /prospect/i, /lead.*name/i, /full.*name/i, /contact.*name/i]);
  const email1 = findVal([/primary.*email/i, /^email/i, /work.*email/i, /email.*address/i]);
  const email2 = findVal([/secondary.*email/i, /alt.*email/i, /other.*email/i]);

  let phone1 = findVal([/mobile.*phone/i, /^mobile/i, /^phone/i, /contact.*number/i, /phone.*number/i]);
  const phone2 = findVal([/alt.*phone/i, /secondary.*phone/i, /other.*phone/i]);

  const company = findVal([/company/i, /employer/i, /organization/i, /business/i, /workplace/i]);
  const city = findVal([/city/i, /location.*city/i, /town/i]);
  const state = findVal([/state/i, /province/i, /region/i]);
  const country = findVal([/country/i, /nation/i]) || 'India';
  const lead_owner = findVal([/owner/i, /agent/i, /assigned/i, /rep/i]);
  const rawStatus = findVal([/status/i, /quality/i, /stage/i, /disposition/i]);
  const rawSource = findVal([/source/i, /campaign/i, /adset/i, /ad.*name/i, /channel/i]);
  const possession = findVal([/possession/i, /expected.*time/i, /timeline/i, /handover/i]);
  const desc = findVal([/budget/i, /specs/i, /description/i, /requirement/i, /project.*details/i]);
  let note = findVal([/note/i, /remark/i, /comment/i, /follow.*up/i, /question/i]);

  let country_code = '+91';
  let mobile_clean = phone1;
  if (phone1.startsWith('+')) {
    const parts = phone1.match(/^(\+\d{1,3})[- ]?(\d+)/);
    if (parts) {
      country_code = parts[1];
      mobile_clean = parts[2];
    }
  } else if (phone1.startsWith('0') && phone1.length === 11) {
    mobile_clean = phone1.slice(1);
  }

  if (email2 && email2 !== email1) {
    note = (note ? note + ' | ' : '') + `Alt email: ${email2}`;
  }
  if (phone2 && phone2 !== phone1) {
    note = (note ? note + ' | ' : '') + `Alt phone: ${phone2}`;
  }

  const created_at = findVal([/date/i, /created/i, /time/i, /submission/i]) || new Date().toISOString().slice(0, 19).replace('T', ' ');

  return {
    created_at,
    name,
    email: email1 || findVal([/email/i]),
    country_code,
    mobile_without_country_code: mobile_clean || findVal([/phone/i, /mobile/i]),
    company,
    city,
    state,
    country,
    lead_owner,
    crm_status: rawStatus,
    crm_note: note,
    data_source: rawSource,
    possession_time: possession,
    description: desc
  };
}

function cleanAndValidateRecord(record, rawRow = {}) {
  let email = (record.email || '').trim();
  let mobile = (record.mobile_without_country_code || '').trim();
  let country_code = (record.country_code || '+91').trim();

  let note = (record.crm_note || '').trim();
  if (email.includes(',')) {
    const parts = email.split(',').map(e => e.trim()).filter(Boolean);
    email = parts[0];
    if (parts.length > 1) {
      note = (note ? note + ' | ' : '') + `Extra emails: ${parts.slice(1).join(', ')}`;
    }
  }

  if (mobile.includes(',') || mobile.includes('/') || mobile.includes(';')) {
    const parts = mobile.split(/[,/;]/).map(p => p.trim()).filter(Boolean);
    mobile = parts[0];
    if (parts.length > 1) {
      note = (note ? note + ' | ' : '') + `Extra phones: ${parts.slice(1).join(', ')}`;
    }
  }

  mobile = mobile.replace(/[^\d]/g, '');

  if (!email && !mobile) {
    return {
      isValid: false,
      reason: 'Missing both email and mobile number'
    };
  }

  let status = (record.crm_status || '').trim().toUpperCase();
  if (!ALLOWED_STATUSES.includes(status)) {
    const sLower = status.toLowerCase();
    if (sLower.includes('bad') || sLower.includes('not interested') || sLower.includes('invalid') || sLower.includes('reject') || sLower.includes('spam') || sLower.includes('low budget') || sLower.includes('closed lost')) {
      status = 'BAD_LEAD';
    } else if (sLower.includes('sale') || sLower.includes('done') || sLower.includes('won') || sLower.includes('closed') || sLower.includes('booked') || sLower.includes('paid')) {
      status = 'SALE_DONE';
    } else if (sLower.includes('connect') || sLower.includes('no answer') || sLower.includes('busy') || sLower.includes('unreachable') || sLower.includes('try again') || sLower.includes('dialed') || sLower.includes('not dialed')) {
      status = 'DID_NOT_CONNECT';
    } else if (sLower.includes('good') || sLower.includes('follow') || sLower.includes('interested') || sLower.includes('new') || sLower.includes('open')) {
      status = 'GOOD_LEAD_FOLLOW_UP';
    } else {
      status = 'GOOD_LEAD_FOLLOW_UP';
    }
  }

  let source = (record.data_source || '').trim().toLowerCase();
  if (!ALLOWED_SOURCES.includes(source)) {
    const combinedStr = `${source} ${JSON.stringify(rawRow)}`.toLowerCase();
    const found = ALLOWED_SOURCES.find(src => combinedStr.includes(src));
    source = found || '';
  }

  let created_at = (record.created_at || '').trim();
  if (!created_at || isNaN(new Date(created_at).getTime())) {
    created_at = new Date().toISOString().slice(0, 19).replace('T', ' ');
  }

  const cleanStr = (str) => (str || '').toString().replace(/\r\n|\n|\r/g, '\\n').trim();

  const finalRecord = {
    created_at,
    name: cleanStr(record.name || rawRow.name || rawRow['Lead Name'] || ''),
    email,
    country_code: country_code || '+91',
    mobile_without_country_code: mobile,
    company: cleanStr(record.company || ''),
    city: cleanStr(record.city || ''),
    state: cleanStr(record.state || ''),
    country: cleanStr(record.country || 'India'),
    lead_owner: cleanStr(record.lead_owner || 'test@gmail.com'),
    crm_status: status,
    crm_note: cleanStr(note),
    data_source: source,
    possession_time: cleanStr(record.possession_time || ''),
    description: cleanStr(record.description || '')
  };

  return {
    isValid: true,
    record: finalRecord
  };
}

module.exports = {
  extractCRMData,
  cleanAndValidateRecord,
  heuristicExtractRow,
  ALLOWED_STATUSES,
  ALLOWED_SOURCES
};
