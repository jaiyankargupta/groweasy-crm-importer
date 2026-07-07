const getHealth = (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    aiProvider: process.env.AI_PROVIDER || 'groq',
    hasGroqKey: !!process.env.GROQ_API_KEY
  });
};

module.exports = {
  getHealth
};
