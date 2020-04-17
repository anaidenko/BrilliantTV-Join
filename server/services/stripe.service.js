const createError = require('http-errors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const logger = require('./logger.service');
const config = require('../config');

// #region Static Variables

const pendingSignupRequestsByEmail = {};

// #endregion

// #region Public Methods

exports.getPlan = async (plan) => {
  const planId = this.getPlanId(plan);
  if (!planId) {
    throw createError(404, 'Plan not found');
  }
  const details = await stripe.plans.retrieve(planId);
  return details;
};

exports.getCoupon = async (code) => {
  let details;
  if (code) {
    details = details || (await findCoupon(code));
    details = details || (await findCoupon(code.toLowerCase()));
    details = details || (await findCoupon(code.toUpperCase()));
  }
  if (!details || !details.valid) {
    throw createError(404, 'Coupon not found');
  }
  return details;
};

exports.assertSubscribed = async (metadata) => {
  const customer = await lookupCustomer(metadata._email || metadata.email);
  if (!customer) {
    throw createError(
      400,
      `Subscription not found by this email address, please make sure it's valid or contact customer support at ${config.CUSTOMER_SUPPORT_EMAIL}.`,
    );
  }

  const subscription = await findSubscription(customer, metadata.plan);
  if (!subscription) {
    throw createError(
      400,
      `Subscription not found by this email address, please make sure it's valid or contact customer support at ${config.CUSTOMER_SUPPORT_EMAIL}.`,
    );
  }

  return { stripeCustomer: customer, stripeSubscription: subscription };
};

exports.findCustomer = async (email) => {
  const customer = await lookupCustomer(email);
  return customer;
};

exports.findSubscription = async (customer, planId) => {
  const subscription = await findSubscription(customer, planId);
  return subscription;
};

exports.subscribe = async (metadata) => {
  // Reject repeated signup call if there are any pending requests for this user matched by email
  checkRepeatedSignupCallFor(metadata.email);

  // Block signup for requested user (by email) to avoid dupliated charges
  pendingSignupRequestsByEmail[metadata.email] = metadata;

  try {
    const customer = await findOrCreateCustomer(metadata);
    await checkIfAlreadySubscribed(customer, metadata.plan);
    await attachPaymentSource(customer, metadata.stripeToken);

    const coupon = metadata.couponCode ? await findCoupon(metadata.couponCode) : undefined;
    const subscription = await createSubscription(customer, coupon, metadata);

    return { stripeCustomer: customer, stripeSubscription: subscription };
  } finally {
    pendingSignupRequestsByEmail[metadata.email] = null;
  }
};

exports.updateCustomer = async (customerId, properties) => {
  const customer = await stripe.customers.update(customerId, properties);
  return customer;
};

exports.getPlanId = (name) => {
  switch ((name || '').toLowerCase()) {
    case 'annual':
    case 'yearly':
      return process.env.STRIPE_YEARLY_PLAN_ID;
    case 'annual-147':
    case 'yearly-147':
      return process.env.STRIPE_YEARLY_147_PLAN_ID;
    case 'annual-97':
    case 'yearly-97':
      return process.env.STRIPE_YEARLY_97_PLAN_ID;
    case 'monthly':
      return process.env.STRIPE_MONTHLY_PLAN_ID;
  }
};

// #endregion

// #region Private Helpers

async function findCoupon(code) {
  try {
    const details = await stripe.coupons.retrieve(code);
    return details;
  } catch (err) {
    if (err.statusCode === 404) {
      return null;
    }
    if (err.statusCode >= 400) {
      throw createError(err.statusCode, 'Failed to retrieve coupon details');
    }
    throw err;
  }
}

function checkRepeatedSignupCallFor(email) {
  if (pendingSignupRequestsByEmail[email]) {
    throw createError(
      400,
      "Please wait, request to signup was already sent and is being processed. You won't be charged twice for registration.",
    );
  }
}

async function lookupCustomer(email) {
  let customer;
  customer = customer || (await findCustomer(email));
  customer = customer || (await findCustomer(email.toLowerCase()));
  customer = customer || (await findCustomer(email.toUpperCase()));
  customer = customer || (await findCustomer(nameToTitleCase(email)));
  return customer;
}

async function findCustomer(email) {
  try {
    // find a customer on Stripe by email address
    let customer = (await stripe.customers.list({
      email,
      limit: 1,
    })).data[0];

    return customer;
  } catch (err) {
    logger.error('stripeService.findCustomer', 'Failed to find Stripe customer', email);
  }
}

async function findOrCreateCustomer(metadata) {
  // find a customer on Stripe by email address
  let customer = await lookupCustomer(metadata._email || metadata.email);

  if (!customer) {
    // if not found, create a new stripe customer
    const customerMetadata = {
      email: metadata.email,
      name: metadata.name,
      // source: metadata.stripeToken,
    };

    try {
      customer = await stripe.customers.create(customerMetadata);
      logger.debug('stripeService.findOrCreateCustomer', 'Stripe customer created', customer);
    } catch (err) {
      logger.error('stripeService.findOrCreateCustomer', 'Failed to create Stripe customer', customerMetadata);
      throw err;
    }
  }

  return customer;
}

async function findSubscription(customer, plan) {
  if (!customer) {
    return;
  }

  const planId = exports.getPlanId(plan);

  // check if customer already subscribed to selected plan
  const subscriptions = (await stripe.subscriptions.list({
    customer: customer.id,
    plan: planId,
  })).data.filter((item) => item.status !== 'cancelled');

  return subscriptions[0];
}

async function checkIfAlreadySubscribed(customer, plan) {
  const existingSubscription = await findSubscription(customer, plan);
  if (existingSubscription) {
    logger.warn(
      'stripeService.checkIfAlreadySubscribed',
      `Signup cancelled due to existing subscription to ${plan} plan for the customer ${customerDisplayName(
        customer,
      )}.`,
      `ID=${existingSubscription.id}. Status=${existingSubscription.status}.`,
    );
    throw createError(
      400,
      `You must have been already subscribed, payment declined. Please proceed to login page or contact customer support at ${config.CUSTOMER_SUPPORT_EMAIL}.`,
    );
  }
}

async function attachPaymentSource(customer, paymentSource) {
  try {
    await stripe.customers.update(customer.id, { source: paymentSource });
  } catch (err) {
    // see https://github.com/stripe/stripe-node/wiki/Error-Handling
    if (err.type === 'StripeCardError') {
      logger.log(
        'stripeService.attachPaymentSource',
        `Failed to attach payment source ${paymentSource} to Stripe customer ${customerDisplayName(customer)}`,
      );
      throw createError(400, err);
    } else {
      logger.error(
        'stripeService.attachPaymentSource',
        `Failed to attach payment source ${paymentSource} to Stripe customer ${customerDisplayName(customer)}`,
      );
      throw err;
    }
  }
}

async function createSubscription(customer, coupon, metadata) {
  const subscriptionMetadata = {
    customer: customer.id,
    collection_method: 'charge_automatically',
    items: [
      {
        plan: metadata.planId,
      },
    ],
    metadata: {
      product: metadata.product,
      plan: metadata.plan,
      marketingOptIn: metadata.marketingOptIn,
    },
    coupon: coupon ? coupon.id : undefined,
  };

  try {
    const subscription = await stripe.subscriptions.create(subscriptionMetadata);
    logger.debug('stripeService.createSubscription', 'Stripe subscription created', subscription);
    return subscription;
  } catch (err) {
    logger.error('stripeService.createSubscription', 'Failed to create Stripe subscription', subscriptionMetadata);
    throw err;
  }
}

function customerDisplayName(customer) {
  return `${customer.name} (${customer.email})`;
}

function nameToTitleCase(email) {
  const [name, ...domain] = email.split('@');
  const result = [toTitleCase(name), ...domain].join('@');
  return result;
}

function toTitleCase(str) {
  return str.replace(/[a-z]+/gi, function(txt) {
    return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
  });
}

// #endregion
