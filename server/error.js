const createError = require('http-errors');
const config = require('./config');
const logger = require('./logger');

const { DEBUG, DEVELOPMENT } = config;
const INTERNAL_SERVER_ERROR = 'Internal Server Error';

class ErrorHandler {
  getMessage(err) {
    if (err && err.message) {
      return String(err.message);
    } else if (err) {
      return String(err);
    } else {
      return INTERNAL_SERVER_ERROR;
    }
  }

  log(tag, error) {
    if (error && error.status) {
      if (error.status >= 400 && error.status < 500) {
        logger.log(tag, `[HTTP${error.status}]`, error);
      } else {
        logger.error(tag, `[HTTP${error.status}]`, error);
      }
    } else {
      logger.error(tag, error);
    }
  }

  send(req, res, err, details) {
    err = attach(err, details);

    if (err.inner) {
      // log user-friendly message for tracking purposes
      logger.debug(err.message);
    }

    if (err) {
      res.status(err.statusCode || 500).json({
        error: true,
        message: this.getMessage(err),
        inner: DEBUG && DEVELOPMENT ? err.inner : undefined,
        stack: DEBUG && DEVELOPMENT ? err.stack : undefined,
      });
    } else {
      res.status(500).json({
        error: true,
        message: INTERNAL_SERVER_ERROR,
      });
    }
  }
}

// #region Helper Functions

function attach(err, props) {
  const code = props && props.code;
  const details = props && props.details;

  if (code || details) {
    if (err && err.status >= 400 && err.status < 500) {
      // attach error details to http error
      if (code) {
        err.code = code;
      }
      if (details) {
        err.details = details;
      }
    } else {
      const inner = err;

      // replace original error with generic one
      err = createError(500, details || code || INTERNAL_SERVER_ERROR);

      err.inner = inner;
      err.stack = inner.stack;
    }
  }

  return err;
}

// #endregion

module.exports = new ErrorHandler();
