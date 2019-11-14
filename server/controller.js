const createError = require('http-errors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const vhx = require('vhx')(process.env.VHX_API_KEY);
const util = require('util');

exports.config = function() {
  const { DEBUG, REACT_APP_BACKEND_URL, STRIPE_PUBLISHABLE_KEY, VHX_PORTAL_URL, INTERCOM_APP_ID } = process.env;
  return { DEBUG, REACT_APP_BACKEND_URL, STRIPE_PUBLISHABLE_KEY, VHX_PORTAL_URL, INTERCOM_APP_ID };
};

exports.planDetails = async function(plan) {
  const planId = getPlanId(plan);
  if (!planId) {
    throw createError(404, 'plan not found');
  }
  const details = await stripe.plans.retrieve(planId);
  return details;
};

exports.signup = async function(metadata) {
  if (!metadata) {
    throw createError(400, 'metadata missing');
  }

  if (metadata.plan === 'annual') {
    metadata.plan = 'yearly';
  }

  // validate
  if (!['yearly', 'monthly'].includes(metadata.plan)) {
    throw createError(400, 'yearly or monthly plan expected');
  }

  console.log('Signup requested', { ...metadata, password: null }); // cloak password

  // check if customer is already registered on stripe
  const stripeCustomerAlreadyExists =
    (await stripe.customers.list({
      email: metadata.email,
      limit: 1,
    })).length > 0;

  if (stripeCustomerAlreadyExists) {
    throw createError(400, 'User is already registered, please proceed to login page');
  }

  // create stripe customer
  let stripeCustomer = null;
  const stripeCustomerMetadata = {
    email: metadata.email,
    name: metadata.name,
    source: metadata.stripeToken,
    metadata: {
      product: metadata.product,
      plan: metadata.plan,
      marketingOptIn: metadata.marketingOptIn,
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

  // create stripe subscription
  let stripeSubscription = null;
  const stripeSubscriptionMetadata = {
    customer: stripeCustomer.id,
    marketing_opt_in: metadata.marketingOptIn,
    collection_method: 'charge_automatically',
    items: [{ plan: getPlanId(metadata.plan) }],
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

  // create vhx customer
  let vhxCustomer = null;
  const vhxCustomerMetadata = {
    email: metadata.email,
    name: metadata.name,
    product: metadata.product,
    plan: metadata.plan,
    password: metadata.password,
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

  return { stripeCustomer, stripeSubscription, vhxCustomer };
};

function getPlanId(name) {
  switch ((name || '').toLowerCase()) {
    case 'annual':
    case 'yearly':
      return process.env.STRIPE_YEARLY_PLAN_ID;
    case 'monthly':
      return process.env.STRIPE_MONTHLY_PLAN_ID;
  }
}
