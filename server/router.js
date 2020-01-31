const express = require('express');
// const router = express.Router();
const router = require('express-promise-router')();
const createError = require('http-errors');
const apicache = require('apicache');
const cache = apicache.middleware;
const error = require('./error');

const controller = require('./controller');
const { parseSignupMetadata } = require('./middlewares');

router.get('/', (req, res) => {
  res.send('Welcome!');
});

router.get('/config', cache('24 hours'), (req, res) => {
  res.json(controller.config());
});

router.get('/config/:plan', cache('1 hour'), async (req, res) => {
  try {
    const config = controller.config();
    const plan = await controller.planDetails(req.params.plan);
    res.json({ ...config, plan });
  } catch (err) {
    error.log('route:/config/:plan', err);
    error.send(req, res, err, { details: 'Failed to provide environment config along with stripe plan.' });
  }
});

router.get('/plan/:name', cache('1 hour'), async (req, res) => {
  try {
    const plan = await controller.planDetails(req.params.name);
    res.json(plan);
  } catch (err) {
    error.log('route:/plan/:name', err);
    error.send(req, res, err, { details: 'Failed to provide stripe plan details.' });
  }
});

router.get('/coupon/:code', cache('1 hour'), async (req, res) => {
  try {
    const coupon = await controller.couponDetails(req.params.code);
    res.json(coupon);
  } catch (err) {
    error.log('route:/coupon/:code', err);
    error.send(req, res, err, { details: 'Failed to provide stripe coupon details.' });
  }
});

router.get('/cache/invalidate', async (req, res) => {
  apicache.clear();
  res.send('done');
});

// router.post('/signup', (req, res) => {
//   res.json({ ok: true });
// })

router.post('/signup', parseSignupMetadata, async (req, res) => {
  try {
    const response = await controller.signup(req.metadata);
    res.send({ ...response, ok: true });
  } catch (err) {
    error.log('route:/signup', err);
    error.send(req, res, err, {
      details: 'Failed to register new user, credit card was not charged. Please contact customer support.',
    });
  }
});

router.all('*', (req, res, next) => {
  next(createError(500, `API not found: ${req.method} ${req.url}`));
});

module.exports = router;
