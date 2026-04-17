const express = require('express');
const app     = express();
const PORT    = process.env.PORT || 8080;

app.use(express.json());

// Health check endpoint (used by K8s liveness/readiness probes)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Sample API endpoint
app.get('/api/v1/status', (req, res) => {
  res.json({ message: 'API is running', uptime: process.uptime() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
