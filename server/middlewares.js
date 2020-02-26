const createError = require('http-errors');
const validator = require('validator');
const services = require('./services');

exports.parseSignupMetadata = (req, res, next) => {
  const body = req.body || {};

  // compose
  const metadata = {
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
