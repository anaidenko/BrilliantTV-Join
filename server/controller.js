const createError = require('http-errors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const vhx = require('vhx')(process.env.VHX_API_KEY);
const util = require('util');

let pendingSignupRequestsByEmail = {};

exports.config = function() {
  const {
    DEBUG,
    INTERCOM_APP_ID,
    REACT_APP_BACKEND_URL,
    SIGNUP_SUCCESS_PAGE,
    STRIPE_PUBLISHABLE_KEY,
    VHX_PORTAL_URL,
  } = process.env;

  return { DEBUG, INTERCOM_APP_ID, REACT_APP_BACKEND_URL, SIGNUP_SUCCESS_PAGE, STRIPE_PUBLISHABLE_KEY, VHX_PORTAL_URL };
};

exports.planDetails = async function(plan) {
  const planId = getPlanId(plan);
  if (!planId) {
    throw new Error('plan not found');
  }
  const details = await stripe.plans.retrieve(planId);
  return details;
};

exports.couponDetails = async function(code) {
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

exports.signup = async function(metadata) {
  if (!metadata) {
    throw new Error('metadata missing');
  }

  metadata.plan = metadata.plan.replace('annual', 'yearly');

  // validate
  if (!getPlanId(metadata.plan)) {
    throw new Error(`plan ${metadata.plan} is not configured`);
  }

  console.log('Signup requested', { ...metadata, password: null }); // cloak password

  // Reject repeated signup call if there are any pending requests for this user matched by email
  if (pendingSignupRequestsByEmail[metadata.email]) {
    throw createError(
      400,
      "Please wait, request to signup was already sent and is being processed. You won't be charged twice for registration.",
    );
  }

  // Block signup for requested user (by email) to avoid dupliated charges
  pendingSignupRequestsByEmail[metadata.email] = metadata;

  try {
    // check if customer is already registered on stripe
    const stripeCustomerAlreadyExists =
      (await stripe.customers.list({
        email: metadata.email,
        limit: 1,
      })).data.length > 0;

    if (stripeCustomerAlreadyExists) {
      throw createError(
        400,
        'You must have been already subscribed, payment declined. Please proceed to login page or contact customer support.',
      );
    }

    // check whether coupon is valid and retrieve details
    const coupon = metadata.couponCode ? await this.couponDetails(metadata.couponCode) : undefined;

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
      collection_method: 'charge_automatically',
      items: [{ plan: getPlanId(metadata.plan) }],
      coupon: coupon ? coupon.id : undefined,
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
      marketing_opt_in: metadata.marketingOptIn,
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
  } finally {
    pendingSignupRequestsByEmail[metadata.email] = null;
  }
};

function getPlanId(name) {
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
}

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
