const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const sslRedirect = require('heroku-ssl-redirect');
const error = require('./error');
const config = require('./config');

const { FORCE_HTTPS, DEVELOPMENT } = config;

const app = express();

// Redirect unencrypted HTTP requests to HTTPS on Heroku instances
if (FORCE_HTTPS) {
  app.use(sslRedirect());
}

app.use(morgan(DEVELOPMENT ? 'dev' : 'combined'));
app.use(bodyParser.json());
app.use(cors());

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, '../build')));

app.use('/api', require('./router'));

app.use((err, req, res, next) => {
  if (err && !err.headers) {
    error.log('app', err);
  }
  error.send(req, res, err);
});

// Handles any requests that don't match the ones above
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html'));
});

module.exports = app;
