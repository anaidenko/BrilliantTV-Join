const express = require('express');
// const router = express.Router();
const router = require('express-promise-router')();
const createError = require('http-errors');
const cache = require('apicache').middleware;

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
    console.error('Error', err);
    throw createError(500, 'Failed to provide environment config along with stripe plan.');
  }
});

router.get('/plan/:name', cache('1 hour'), async (req, res) => {
  try {
    const plan = await controller.planDetails(req.params.name);
    res.json(plan);
  } catch (err) {
    console.error('Error', err);
    throw createError(500, 'Failed to provide stripe plan details.');
  }
});

// router.post('/signup', (req, res) => {
//   res.json({ ok: true });
// })

router.post('/signup', parseSignupMetadata, async (req, res) => {
  try {
    console.log('metadata', req.metadata);
    const response = await controller.signup(req.metadata);
    res.send({ ...response, ok: true });
  } catch (err) {
    console.error('Error', err);
    if (err && err.status >= 400) {
      throw err;
    } else {
      throw createError(500, 'Failed to register new user, credit card was not charged. Please contact customer support.');
    }    
  }
});

router.all('*', (req, res, next) => {
  next(createError(404, 'API not found'));
});

module.exports = router;
