const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

require('./config');

const app = express();

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(bodyParser.json());
app.use(cors());

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, '../build')));

app.use('/api', require('./router'));

app.use((err, req, res, next) => {
  if (err && !err.headers) {
    console.error('Error', err);
  }
  if (err) {
    res.status(err.statusCode || 500).json({
      error: true,
      message: String(err.message || err || 'Internal Server Error'),
      stack: process.env.DEBUG === 'true' ? err.stack : undefined,
    });
  } else {
    res.status(500).json({
      error: true,
      message: 'Internal Server Error',
    });
  }
});

// Handles any requests that don't match the ones above
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

module.exports = app;
