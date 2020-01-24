const config = require('./config');
const { DEBUG } = config;

class Logger {
  log(tag, ...message) {
    console.log('[LOG]', `[${tag}]`, ...message.map(normalized));
  }

  warn(tag, ...message) {
    console.warn('[WARN]', `[${tag}]`, ...message.map(normalized));
  }

  error(tag, ...message) {
    console.error('[ERROR]', `[${tag}]`, ...message.map(normalized));
  }

  debug(tag, ...message) {
    if (DEBUG) {
      console.debug(`[DEBUG]`, `[${tag}]`, ...message.map(normalized));
    }
  }
}

// #region Helper Functions

function normalized(obj) {
  if (!obj) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj;
  if (obj instanceof Error) return obj;

  // sort object properties for readability purposes
  const objOrdered = Object.fromEntries(Object.entries(obj).sort(byEntryKey));
  return objOrdered;
}

function byEntryKey(a, b) {
  if (a[0] < b[0]) {
    return -1;
  }
  if (a[0] > b[0]) {
    return 1;
  }
  return 0;
}

// #endregion

module.exports = new Logger();
