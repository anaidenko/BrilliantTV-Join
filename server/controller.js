const apicache = require('apicache');
const services = require('./services');
const error = require('./error');
const logger = require('./logger');

exports.config = async function(req, res) {
  try {
    const config = services.config();
    if (req.params.plan) {
      const plan = await services.getStripePlan(req.params.plan);
      res.json({ ...config, plan });
    } else {
      res.json(config);
    }
  } catch (err) {
    error.log('controller:config', err);
    error.send(req, res, err, { details: 'Failed to provide environment config.' });
  }
};

exports.planDetails = async function(req, res) {
  try {
    const plan = await services.getStripePlan(req.params.name);
    res.json(plan);
  } catch (err) {
    error.log('controller:planDetails', err);
    error.send(req, res, err, { details: 'Failed to provide stripe plan details.' });
  }
};

exports.couponDetails = async function(req, res) {
  try {
    const coupon = await services.getStripeCoupon(req.params.code);
    res.json(coupon);
  } catch (err) {
    error.log('controller:couponDetails', err);
    error.send(req, res, err, { details: 'Failed to provide stripe coupon details.' });
  }
};

exports.invalidateCache = async function(req, res) {
  try {
    apicache.clear();
    res.send('done, cache invalidated');
  } catch (err) {
    error.log('controller:invalidateCache', err);
    error.send(req, res, err);
  }
};

exports.signup = async function(req, res) {
  try {
    let stripeResponse, vhxResponse;

    logger.log('controller:signup', 'Signup requested', { ...req.metadata, password: '[HIDDEN]' }); // cloak password

    try {
      stripeResponse = await services.subscribeToStripePlan(req.metadata);
    } catch (err) {
      error.log('controller:signup', err);
      error.send(req, res, err, {
        details: 'Failed to register new user, credit card was not charged. Please contact customer support.',
      });
      return;
    }

    try {
      vhxResponse = await services.signupAtVhx(req.metadata);
    } catch (err) {
      error.log('controller:signup', err);
      error.send(req, res, err, {
        details: 'Failed to register new user, please contact customer support.',
      });
      return;
    }

    const response = { ...stripeResponse, ...vhxResponse };

    logger.log('controller:signup', 'Signup complete', {
      ...req.metadata,
      subscription: stripeResponse.stripeSubscription.id,
      password: '[HIDDEN]', // cloak password
    });

    res.send({ ...response, ok: true });
  } catch (err) {
    error.log('controller:signup', err);
    error.send(req, res, err);
  }
};
