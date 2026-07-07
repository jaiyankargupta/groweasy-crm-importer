const express = require('express');
const upload = require('../middleware/uploadMiddleware');
const { getHealth } = require('../controllers/healthController');
const { uploadCSV, extractData, getJobStatus } = require('../controllers/importController');

const router = express.Router();

router.get('/health', getHealth);
router.post('/upload', upload.single('file'), uploadCSV);
router.post('/extract', extractData);
router.get('/status/:jobId', getJobStatus);

module.exports = router;
