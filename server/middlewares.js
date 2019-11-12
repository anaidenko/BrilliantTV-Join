exports.parseSignupMetadata = (req, res, next) => {
  const body = req.body || {};

  // compose
  const metadata = {
    email: (body.email || '').toLowerCase(),
    name: body.name,
    password: body.password,
    stripeToken: body.stripeToken,
    product: process.env.VHX_PRODUCT,
    plan: body.plan || 'yearly',
  };

  // validate
  if (!metadata.email) {
    throw createError(400, 'Email missing');
  }
  if (!metadata.name) {
    throw createError(400, 'Name missing');
  }
  if (!metadata.stripeToken) {
    throw createError(400, 'Stripe token missing');
  }

  req.metadata = metadata;
  next();

  return metadata;
};
