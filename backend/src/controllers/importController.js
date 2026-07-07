const { parseCSV } = require('../utils/csvParser');
const { extractCRMData } = require('../services/aiService');

const jobs = new Map();

const uploadCSV = (req, res) => {
  try {
    let inputData = null;

    if (req.file && req.file.buffer) {
      inputData = req.file.buffer;
    } else if (req.body && req.body.csvString) {
      inputData = req.body.csvString;
    } else {
      return res.status(400).json({
        success: false,
        error: 'No CSV file or string provided. Send multipart/form-data with "file" field or JSON with "csvString".'
      });
    }

    const parseResult = parseCSV(inputData);

    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: `CSV Parsing Failed: ${parseResult.error}`
      });
    }

    return res.json({
      success: true,
      filename: req.file ? req.file.originalname : 'uploaded_string.csv',
      totalRows: parseResult.totalRows,
      headers: parseResult.headers,
      records: parseResult.records
    });
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('[API Upload Error]', error);
    }
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const extractData = async (req, res) => {
  try {
    const { records, provider, batchSize, jobId } = req.body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or empty records array provided.'
      });
    }

    const safeBatchSize = Math.min(Math.max(parseInt(batchSize || 15, 10), 1), 100);

    if (jobId) {
      jobs.set(jobId, {
        status: 'processing',
        batchIndex: 0,
        totalBatches: Math.ceil(records.length / safeBatchSize),
        processedRows: 0,
        totalRows: records.length,
        percentage: 0
      });
    }

    const result = await extractCRMData(records, {
      provider,
      batchSize: safeBatchSize,
      onProgress: (progressData) => {
        if (jobId) {
          jobs.set(jobId, progressData);
        }
      }
    });

    if (jobId) {
      jobs.set(jobId, {
        status: 'completed',
        percentage: 100,
        result
      });
    }

    return res.json(result);
  } catch (error) {
    if (process.env.NODE_ENV !== 'test') {
      console.error('[API Extract Error]', error);
    }
    if (req.body.jobId) {
      jobs.set(req.body.jobId, {
        status: 'error',
        error: error.message
      });
    }
    return res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

const getJobStatus = (req, res) => {
  const { jobId } = req.params;
  const job = jobs.get(jobId);

  if (!job) {
    return res.status(404).json({
      success: false,
      error: 'Job ID not found.'
    });
  }

  return res.json({
    success: true,
    jobId,
    ...job
  });
};

module.exports = {
  uploadCSV,
  extractData,
  getJobStatus
};
