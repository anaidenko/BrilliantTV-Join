const createError = require('http-errors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const vhx = require('vhx')(process.env.VHX_API_KEY);
const util = require('util');
const logger = require('./logger');

// #region Static Variables

const pendingSignupRequestsByEmail = {};

// #endregion

// #region Public Methods

exports.config = () => {
  const {
    DEBUG,
    INTERCOM_APP_ID,
    REACT_APP_BACKEND_URL,
    SIGNUP_SUCCESS_PAGE,
    SIGNUP_THANK_YOU_SITE_URL,
    STRIPE_PUBLISHABLE_KEY,
    VHX_PORTAL_URL,
  } = process.env;

  return {
    DEBUG,
    INTERCOM_APP_ID,
    REACT_APP_BACKEND_URL,
    SIGNUP_SUCCESS_PAGE,
    SIGNUP_THANK_YOU_SITE_URL,
    STRIPE_PUBLISHABLE_KEY,
    VHX_PORTAL_URL,
  };
};

exports.getStripePlan = async (plan) => {
  const planId = this.getPlanId(plan);
  if (!planId) {
    throw createError(404, 'Plan not found');
  }
  const details = await stripe.plans.retrieve(planId);
  return details;
};

exports.getStripeCoupon = async (code) => {
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

exports.subscribeToStripePlan = async (metadata) => {
  // Reject repeated signup call if there are any pending requests for this user matched by email
  checkRepeatedSignupCallFor(metadata.email);

  // Block signup for requested user (by email) to avoid dupliated charges
  pendingSignupRequestsByEmail[metadata.email] = metadata;

  try {
    const stripeCustomer = await findOrCreateStripeCustomer(metadata);
    await checkIfAlreadySubscribed(stripeCustomer, metadata.plan);
    await attachStripePaymentSource(stripeCustomer, metadata.stripeToken);

    const coupon = metadata.couponCode ? await this.couponDetails(metadata.couponCode) : undefined;
    const stripeSubscription = await createStripeSubscription(stripeCustomer, coupon, metadata);

    return { stripeCustomer, stripeSubscription };
  } finally {
    pendingSignupRequestsByEmail[metadata.email] = null;
  }
};

exports.signupAtVhx = async (metadata) => {
  // Reject repeated signup call if there are any pending requests for this user matched by email
  checkRepeatedSignupCallFor(metadata.email);

  // Block signup for requested user (by email) to avoid dupliated charges
  pendingSignupRequestsByEmail[metadata.email] = metadata;

  try {
    const vhxCustomer = await createVhxCustomer(metadata);
    return { vhxCustomer };
  } finally {
    pendingSignupRequestsByEmail[metadata.email] = null;
  }
};

exports.getPlanId = (name) => {
  switch ((name || '').toLowerCase()) {
    case 'annual':
    case 'yearly':
      return process.env.STRIPE_YEARLY_PLAN_ID;
    case 'annual-$147':
    case 'yearly-$147':
    case 'annual-147':
    case 'yearly-147':
      return process.env.STRIPE_YEARLY_147_PLAN_ID;
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

async function findOrCreateStripeCustomer(metadata) {
  // find a customer on Stripe by email address
  let stripeCustomer = (await stripe.customers.list({
    email: metadata.email,
    limit: 1,
  })).data[0];

  if (!stripeCustomer) {
    // if not found, create a new stripe customer
    const stripeCustomerMetadata = {
      email: metadata.email,
      name: metadata.name,
      // source: metadata.stripeToken,
    };

    try {
      stripeCustomer = await stripe.customers.create(stripeCustomerMetadata);
      logger.debug('findOrCreateStripeCustomer', 'Stripe customer created', stripeCustomer);
    } catch (err) {
      logger.error('findOrCreateStripeCustomer', 'Failed to create Stripe customer', stripeCustomerMetadata);
      throw err;
    }
  }

  return stripeCustomer;
}

async function checkIfAlreadySubscribed(stripeCustomer, plan) {
  if (!stripeCustomer) {
    return;
  }

  const planId = exports.getPlanId(plan);

  // check if customer already subscribed to selected plan
  const subscriptions = (await stripe.subscriptions.list({
    customer: stripeCustomer.id,
    plan: planId,
  })).data.filter((item) => item.status !== 'cancelled');

  if (subscriptions.length > 0) {
    const existingSubscription = subscriptions[0];
    logger.warn(
      'checkIfAlreadySubscribed',
      `Signup cancelled due to existing subscription to ${plan} plan for the customer ${customerDisplayName(
        stripeCustomer,
      )}.`,
      `ID=${existingSubscription.id}. Status=${existingSubscription.status}.`,
    );
    throw createError(
      400,
      'You must have been already subscribed, payment declined. Please proceed to login page or contact customer support.',
    );
  }
}

async function attachStripePaymentSource(stripeCustomer, paymentSource) {
  try {
    await stripe.customers.update(stripeCustomer.id, { source: paymentSource });
  } catch (err) {
    // see https://github.com/stripe/stripe-node/wiki/Error-Handling
    if (err.type === 'StripeCardError') {
      logger.log(
        'attachStripePaymentSource',
        `Failed to attach payment source ${paymentSource} to Stripe customer ${customerDisplayName(stripeCustomer)}`,
      );
      throw createError(400, err);
    } else {
      logger.error(
        'attachStripePaymentSource',
        `Failed to attach payment source ${paymentSource} to Stripe customer ${customerDisplayName(stripeCustomer)}`,
      );
      throw err;
    }
  }
}

async function createStripeSubscription(stripeCustomer, coupon, metadata) {
  const stripeSubscriptionMetadata = {
    customer: stripeCustomer.id,
    collection_method: 'charge_automatically',
    items: [
      {
        plan: metadata.planId,
        metadata: {
          product: metadata.product,
          plan: metadata.plan,
          marketingOptIn: metadata.marketingOptIn,
        },
      },
    ],
    coupon: coupon ? coupon.id : undefined,
  };

  try {
    const stripeSubscription = await stripe.subscriptions.create(stripeSubscriptionMetadata);
    logger.debug('createStripeSubscription', 'Stripe subscription created', stripeSubscription);
    return stripeSubscription;
  } catch (err) {
    logger.error('createStripeSubscription', 'Failed to create Stripe subscription', stripeSubscriptionMetadata);
    throw err;
  }
}

function customerDisplayName(stripeCustomer) {
  return `${stripeCustomer.name} (${stripeCustomer.email})`;
}

async function createVhxCustomer(metadata) {
  const vhxCustomerMetadata = {
    email: metadata.email,
    name: metadata.name,
    product: metadata.product,
    plan: metadata.plan,
    password: metadata.password,
    marketing_opt_in: metadata.marketingOptIn,
  };

  try {
    const vhxCustomer = await util.promisify(vhx.customers.create)(vhxCustomerMetadata);
    logger.debug('createVhxCustomer', 'VHX customer created', vhxCustomer);
    return vhxCustomer;
  } catch (err) {
    logger.error('createVhxCustomer', 'Failed to create VHX customer', vhxCustomerMetadata);
    throw err;
  }
}

// #endregion
