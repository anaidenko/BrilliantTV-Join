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
    product: process.env.VHX_PRODUCT,
    plan: body.plan || 'yearly',
  };

  if (metadata.plan === 'annual') {
    metadata.plan = 'yearly'; // configured on VHX side
  }

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
  if (!['yearly', 'monthly'].includes(metadata.plan)) {
    throw createError(400, 'yearly or monthly plan expected');
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
    let stripeCustomer = null;
    const stripeCustomerMetadata = {
      email: metadata.email,
      name: metadata.name,
      source: metadata.stripeToken,
      metadata: {
        product: metadata.product,
        plan: metadata.plan,
      },
    };
    try {
      stripeCustomer = await stripe.customers.create(stripeCustomerMetadata);
      if (process.env.DEBUG === 'true') {
        console.log('Stripe customer created', stripeCustomer);
      }
    } catch (err) {
      console.error('Failed to create Stripe customer', stripeCustomerMetadata);
      throw err;
    }

    let stripeSubscription = null;
    const stripePlan =
      metadata.plan === 'yearly'
        ? process.env.STRIPE_SUBSCRIPTION_YEARLY_PLAN_ID
        : process.env.STRIPE_SUBSCRIPTION_MONTHLY_PLAN_ID;
    const stripeSubscriptionMetadata = {
      customer: stripeCustomer.id,
      collection_method: 'charge_automatically',
      items: [{ plan: stripePlan }],
    };
    try {
      stripeSubscription = await stripe.subscriptions.create(stripeSubscriptionMetadata);
      if (process.env.DEBUG === 'true') {
        console.log('Stripe subscription created', stripeSubscription);
      }
    } catch (err) {
      console.error('Failed to create Stripe subscription', stripeSubscriptionMetadata);
      throw err;
    }

    let vhxCustomer = null;
    const vhxCustomerMetadata = {
      email: metadata.email,
      name: metadata.name,
      product: metadata.product,
      plan: metadata.plan,
    };
    try {
      vhxCustomer = await util.promisify(vhx.customers.create)(vhxCustomerMetadata);
      if (process.env.DEBUG === 'true') {
        console.log('VHX customer created', vhxCustomer);
      }
    } catch (err) {
      console.error('Failed to create VHX customer', vhxCustomerMetadata);
      throw err;
    }

    console.log('Signup complete', { ...metadata, password: null }); // cloak password

    res.send({ ok: true, stripeCustomer, stripeSubscription, vhxCustomer });
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
