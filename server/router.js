const express = require('express');
// const router = express.Router();
const router = require('express-promise-router')();
const createError = require('http-errors');
const cache = require('apicache').middleware;

const controller = require('./controller');
const middlewares = require('./middlewares');

router.get('/', (req, res) => {
  res.send('Welcome!');
});

router.get('/config', cache('24 hours'), controller.config);
router.get('/config/:plan', cache('1 hour'), controller.config);

router.get('/plan/:name', cache('1 hour'), controller.planDetails);
router.get('/coupon/:code', cache('1 hour'), controller.couponDetails);

router.get('/cache/invalidate', controller.invalidateCache);

// router.post('/signup', (req, res) => res.json({ ok: true }));

router.post('/signup', middlewares.parseSignupMetadata, controller.signup);

router.all('*', (req, res, next) => {
  next(createError(500, `API not found: ${req.method} ${req.url}`));
});

module.exports = router;
