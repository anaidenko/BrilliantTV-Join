const createError = require('http-errors');
const validator = require('validator');
const services = require('./services');

exports.parseSignupMetadata = (req, res, next) => {
  const body = req.body || {};

  // compose
  const metadata = {
    _email: body.email || '',
    email: (body.email || '').toLowerCase(),
    name: body.name,
    password: body.password || undefined,
    stripeToken: body.stripeToken,
    product: process.env.VHX_PRODUCT || undefined,
    couponCode: body.couponCode || undefined,
    marketingOptIn: !!body.marketingOptIn,
    plan: body.plan || 'yearly',
    prePurchased: !!body.prePurchased,
  };

  // normalize
  metadata.plan = metadata.plan.replace('annual', 'yearly');

  // extend
  metadata.planId = services.stripe.getPlanId(metadata.plan);

  // validate
  if (!metadata.email) {
    throw createError(400, 'Email missing');
  }
  if (!validator.isEmail(metadata.email)) {
    throw createError(400, 'Email address invalid');
  }
  if (!metadata.name) {
    throw createError(400, 'Name missing');
  }
  if (!/^[a-z0-9 ]+$/i.test(metadata.name)) {
    throw createError(400, 'Name can contain only letters, numbers, and spaces');
  }
  if (!metadata.prePurchased && !metadata.stripeToken) {
    throw createError(400, 'Stripe token missing');
  }
  if (!metadata.planId) {
    throw createError(400, `plan ${metadata.plan} is not configured`);
  }

  req.metadata = metadata;
  next();

  return metadata;
};

exports.parseRegisteredMetadata = (req, res, next) => {
  let { email } = req.query;
  let { name: plan } = req.params;

  // normalize
  const _email = email || ''; // original
  email = (email || '').toLowerCase();
  plan = (plan || '').toLowerCase();

  // validate
  if (!email) {
    throw createError(400, 'Email not provided');
  }

  if (!validator.isEmail(email)) {
    throw createError(400, 'Email invalid');
  }

  const planId = plan ? services.stripe.getPlanId(plan) : null;
  if (plan && !planId) {
    throw createError(404, 'Plan not found');
  }

  // compose
  const metadata = { email, plan, planId, _email };

  req.metadata = metadata;
  next();

  return metadata;
};
