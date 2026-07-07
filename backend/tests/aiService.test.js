const request = require('supertest');
const app = require('../src/server');
const { parseCSV } = require('../src/utils/csvParser');
const { extractCRMData, cleanAndValidateRecord, heuristicExtractRow } = require('../src/services/aiService');

describe('GrowEasy CSV Parser Utility', () => {
  test('should correctly parse standard CSV string into records and headers', () => {
    const csvString = `name,email,mobile_without_country_code\nJohn Doe,john@example.com,9876543210\nSarah Khan,sarah@example.com,9876543211`;
    const result = parseCSV(csvString);
    expect(result.success).toBe(true);
    expect(result.totalRows).toBe(2);
    expect(result.headers).toEqual(['name', 'email', 'mobile_without_country_code']);
    expect(result.records[0].name).toBe('John Doe');
  });

  test('should handle messy CSVs with irregular quotes and spaces', () => {
    const csvString = `Lead Name , Contact Email , Phone Number \n "Jane Smith" , jane.smith@domain.co , +91-9988776655 \n`;
    const result = parseCSV(csvString);
    expect(result.success).toBe(true);
    expect(result.totalRows).toBe(1);
    expect(result.records[0]['Lead Name']).toBe('Jane Smith');
  });

  test('should handle empty CSV input gracefully', () => {
    const result = parseCSV('   \n  ');
    expect(result.success).toBe(false);
    expect(result.error).toBe('CSV input is empty.');
  });

  test('should strip UTF-8 BOM if present at start of file', () => {
    const csvString = '\uFEFFname,email\nJohn Doe,john@test.com';
    const result = parseCSV(csvString);
    expect(result.success).toBe(true);
    expect(result.headers).toEqual(['name', 'email']);
    expect(result.records[0].name).toBe('John Doe');
  });
});

describe('GrowEasy AI Service Rules & Cleaning', () => {
  test('Rule 1: should normalize CRM status values correctly', () => {
    expect(cleanAndValidateRecord({ email: 'test@test.com', crm_status: 'interested in demo' }).record.crm_status).toBe('GOOD_LEAD_FOLLOW_UP');
    expect(cleanAndValidateRecord({ email: 'test@test.com', crm_status: 'no answer called twice' }).record.crm_status).toBe('DID_NOT_CONNECT');
    expect(cleanAndValidateRecord({ email: 'test@test.com', crm_status: 'not interested / bad' }).record.crm_status).toBe('BAD_LEAD');
    expect(cleanAndValidateRecord({ email: 'test@test.com', crm_status: 'deal closed won' }).record.crm_status).toBe('SALE_DONE');
  });

  test('Rule 2: should normalize Data Source values to allowed enum or blank', () => {
    expect(cleanAndValidateRecord({ email: 'test@test.com', data_source: 'meridian_tower' }).record.data_source).toBe('meridian_tower');
    expect(cleanAndValidateRecord({ email: 'test@test.com', data_source: 'some_unknown_source' }).record.data_source).toBe('');
    expect(cleanAndValidateRecord({ email: 'test@test.com', data_source: 'leads_on_demand' }).record.data_source).toBe('leads_on_demand');
  });

  test('Rule 5: should handle multiple emails and phone numbers by appending to crm_note', () => {
    const raw = {
      email: 'primary@test.com, secondary@test.com',
      mobile_without_country_code: '9876543210 / 9876543211',
      crm_note: 'Initial note'
    };
    const cleaned = cleanAndValidateRecord(raw);
    expect(cleaned.record.email).toBe('primary@test.com');
    expect(cleaned.record.mobile_without_country_code).toBe('9876543210');
    expect(cleaned.record.crm_note).toContain('Extra emails: secondary@test.com');
    expect(cleaned.record.crm_note).toContain('Extra phones: 9876543211');
  });

  test('Rule 7: should skip records containing neither email nor mobile number', () => {
    const validEmailOnly = cleanAndValidateRecord({ email: 'test@domain.com', mobile_without_country_code: '' });
    expect(validEmailOnly.isValid).toBe(true);

    const validPhoneOnly = cleanAndValidateRecord({ email: '', mobile_without_country_code: '9876543210' });
    expect(validPhoneOnly.isValid).toBe(true);

    const invalidBothEmpty = cleanAndValidateRecord({ email: '', mobile_without_country_code: '' });
    expect(invalidBothEmpty.isValid).toBe(false);
    expect(invalidBothEmpty.reason).toBe('Missing both email and mobile number');
  });
});

describe('Heuristic AI Extraction Fallback', () => {
  test('should accurately extract CRM fields from Facebook Lead Export column names', async () => {
    const sampleRows = [
      {
        submission_time: '2026-06-01 10:15:00',
        full_name: 'Amit Kumar',
        work_email: 'amit.k@techinnovate.in',
        phone_number: '+91-9811223344',
        company_name: 'Tech Innovate',
        city: 'Bangalore',
        state: 'Karnataka',
        country: 'India',
        campaign_name: 'leads_on_demand',
        notes_or_questions: 'Interested in AI',
        lead_quality: 'Good'
      }
    ];

    const result = await extractCRMData(sampleRows, { provider: 'heuristic' });
    expect(result.success).toBe(true);
    expect(result.totalImported).toBe(1);
    expect(result.parsedRecords[0].name).toBe('Amit Kumar');
    expect(result.parsedRecords[0].email).toBe('amit.k@techinnovate.in');
    expect(result.parsedRecords[0].mobile_without_country_code).toBe('9811223344');
    expect(result.parsedRecords[0].company).toBe('Tech Innovate');
    expect(result.parsedRecords[0].data_source).toBe('leads_on_demand');
    expect(result.parsedRecords[0].crm_status).toBe('GOOD_LEAD_FOLLOW_UP');
  });
});

describe('Express REST API Endpoints', () => {
  test('GET /api/health should return ok status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('POST /api/upload should parse CSV string in body', async () => {
    const csvString = `name,email,mobile_without_country_code\nJohn Doe,john@test.com,9876543210`;
    const res = await request(app)
      .post('/api/upload')
      .send({ csvString });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.totalRows).toBe(1);
    expect(res.body.records[0].name).toBe('John Doe');
  });

  test('POST /api/extract should return structured JSON records', async () => {
    const records = [
      {
        'Lead Name': 'Sarah Johnson',
        'Contact Email': 'sarah@test.com',
        'Phone': '9876543211',
        'Company': 'Tech Solutions',
        'Status': 'No Answer',
        'Source': 'meridian_tower'
      },
      {
        'Lead Name': 'Invalid Lead Without Contact',
        'Contact Email': '',
        'Phone': ''
      }
    ];

    const res = await request(app)
      .post('/api/extract')
      .send({ records, provider: 'heuristic' });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.totalImported).toBe(1);
    expect(res.body.totalSkipped).toBe(1);
    expect(res.body.parsedRecords[0].name).toBe('Sarah Johnson');
    expect(res.body.parsedRecords[0].crm_status).toBe('DID_NOT_CONNECT');
    expect(res.body.parsedRecords[0].data_source).toBe('meridian_tower');
    expect(res.body.skippedRecords[0].reason).toBe('Missing both email and mobile number');
  });

  test('POST /api/upload should reject non-CSV files via multer file filter', async () => {
    const res = await request(app)
      .post('/api/upload')
      .attach('file', Buffer.from('hello world'), { filename: 'test.txt', contentType: 'text/plain' });
    expect(res.statusCode).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Only .csv files are permitted');
  });
});
