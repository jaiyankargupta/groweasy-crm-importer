require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/apiRoutes');

const app = express();
const port = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use('/api', apiRoutes);

app.use((err, req, res, next) => {
  if (process.env.NODE_ENV !== 'test') {
    console.error('[Unhandled Server Error]', err.message || err);
  }
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`[GrowEasy Backend] Server listening on port ${port}`);
    console.log(`[GrowEasy Backend] AI Provider mode: ${process.env.AI_PROVIDER || 'groq'}`);
  });
}

module.exports = app;
