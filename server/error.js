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
      logger.error(tag, `[HTTP${error.status}]`, error);
    } else {
      logger.error(tag, error);
    }
  }

  send(req, res, err, { code, details }) {
    err = attach(err, { code, details });

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

function attach(err, { code, details }) {
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
