require('dotenv').config();

module.exports = {
  DEBUG: process.env.DEBUG === 'true',
  DEVELOPMENT: process.env.NODE_ENV === 'development',
  FORCE_HTTPS: process.env.FORCE_HTTPS === 'true',
  CUSTOMER_SUPPORT_EMAIL: process.env.CUSTOMER_SUPPORT_EMAIL || 'help@brilliantperspectives.com',
};
