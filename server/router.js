const express = require('express');
// const router = express.Router();
const router = require('express-promise-router')();
const createError = require('http-errors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const vhx = require('vhx')(process.env.VHX_API_KEY);
const util = require('util');
const axios = require('axios');

router.get('/', (req, res) => {
  res.send('Welcome!');
});

router.get('/config', (req, res) => {
  const { DEBUG, REACT_APP_BACKEND_URL, STRIPE_PUBLISHABLE_KEY, VHX_PORTAL_URL } = process.env;
  res.json({
    DEBUG,
    REACT_APP_BACKEND_URL,
    STRIPE_PUBLISHABLE_KEY,
    VHX_PORTAL_URL,
  });
});

// router.post('/signup', (req, res) => {
//   res.json({ ok: true });
// })

router.post('/signup', async (req, res) => {
  // parse metadata
  const body = req.body || {};
  const metadata = {
    email: (body.email || '').toLowerCase(),
    name: body.name,
    password: body.password,
    stripeToken: body.stripeToken,
    marketingOptIn: body.marketingOptIn,
  };

  // validate
  if (!metadata.email) {
    throw createError(400, 'Email missing');
  }
  if (!metadata.name) {
    throw createError(400, 'Name missing');
  }
  if (!metadata.password) {
    throw createError(400, 'Password missing');
  }
  if (!metadata.stripeToken) {
    throw createError(400, 'Stripe token missing');
  }

  console.log('Signup requested', { ...metadata, password: null }); // cloak password

  const stripeCustomerAlreadyExists =
    (await stripe.customers.list({
      email: metadata.email,
      limit: 1,
    })).length > 0;

  if (stripeCustomerAlreadyExists) {
    throw createError(400, 'User is already registered, please proceed to login page');
  }

  try {
    const stripeCustomer = await stripe.customers.create({
      email: metadata.email,
      name: metadata.name,
      source: metadata.stripeToken,
    });
    console.log('Stripe customer created', stripeCustomer);

    const vhxCustomer = await util.promisify(vhx.customers.create)({
      email: metadata.email,
      name: metadata.name,
    });
    console.log('VHX customer created', vhxCustomer);

    if (process.env.VHX_REGISTER === 'true') {
      const vhxUser = await axios.post(`${process.env.VHX_PORTAL_URL}/registration.json`, {
        email: metadata.email,
        is_avod_registration: false,
        marketing_opt_in: Boolean(metadata.marketingOptIn || false),
        name: metadata.name,
        password: metadata.password,
        product_sku: process.env.VHX_PRODUCT_SKU,
        product_type: process.env.VHX_PRODUCT_TYPE,
        send_email: 0,
        v2_checkout: true,
      });
      console.log('VHX user registered', vhxUser);
    }

    const subscription = await stripe.subscriptions.create({
      customer: stripeCustomer.id,
      collection_method: 'charge_automatically',
      items: [{ plan: process.env.STRIPE_SUBSCRIPTION_PLAN_ID }],
    });
    console.log('Stripe subscription created', subscription);

    console.log('Signup complete', { ...metadata, password: null }); // cloak password

    res.send({ ok: true, stripeCustomer, subscription, vhxCustomer });
  } catch (err) {
    console.error('Error', err);
    throw createError(
      500,
      'Failed to register new user, credit card was not charged. Please contact customer support.',
    );
  }
});

router.all('*', (req, res, next) => {
  next(createError(404, 'API not found'));
});

module.exports = router;
