const apicache = require('apicache');
const services = require('./services');
const createError = require('http-errors');
const error = require('./services/error.service');
const logger = require('./services/logger.service');
const config = require('./config');

exports.config = async function(req, res) {
  try {
    const config = services.core.config();
    if (req.params.plan) {
      const plan = await services.stripe.getPlan(req.params.plan);
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
    const plan = await services.stripe.getPlan(req.params.name);
    res.json(plan);
  } catch (err) {
    error.log('controller:planDetails', err);
    error.send(req, res, err, { details: 'Failed to provide stripe plan details.' });
  }
};

exports.couponDetails = async function(req, res) {
  try {
    const coupon = await services.stripe.getCoupon(req.params.code);
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

    if (!req.metadata.prePurchased) {
      try {
        stripeResponse = await services.stripe.subscribe(req.metadata);
      } catch (err) {
        error.log('controller:signup', err);
        error.send(req, res, err, {
          details: `Failed to register new user, credit card was not charged. Please contact customer support at ${config.CUSTOMER_SUPPORT_EMAIL}.`,
        });
        return;
      }
    } else {
      try {
        stripeResponse = await services.stripe.assertSubscribed(req.metadata);
      } catch (err) {
        error.log('controller:signup', err);
        error.send(req, res, err, {
          details: `Subscription not found by this email address, please make sure it's valid or contact customer support at ${config.CUSTOMER_SUPPORT_EMAIL}.`,
        });
        return;
      }
    }

    try {
      vhxResponse = await services.vhx.signup(req.metadata, stripeResponse.stripeCustomer.metadata.vhxCustomerHref);
    } catch (err) {
      error.log('controller:signup', err);
      error.send(req, res, err, {
        details: `Failed to register user, please contact customer support at ${config.CUSTOMER_SUPPORT_EMAIL}.`,
      });
      return;
    }

    try {
      if (vhxResponse.isNewCustomer) {
        const vhxCustomerHref = vhxResponse.vhxCustomer._links.self.href;
        await services.stripe.updateCustomer(stripeResponse.stripeCustomer.id, {
          metadata: { vhxCustomerHref },
        });
      }
    } catch (err) {
      error.log('controller:signup', err);
      // ignore and fall back down - not critical
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

exports.customerRegistered = async function(req, res) {
  try {
    const { email } = req.metadata;

    const stripeCustomer = await services.stripe.findCustomer(email);

    if (stripeCustomer && stripeCustomer.metadata && stripeCustomer.metadata.vhxCustomerHref) {
      const vhxCustomer = await services.vhx.findCustomer(stripeCustomer.metadata.vhxCustomerHref);
      if (vhxCustomer) {
        res.json({ email, registered: true });
        return;
      }
    }

    res.json({ email, registered: false });
  } catch (err) {
    error.log('controller:customerRegistered', err);
    error.send(req, res, err);
  }
};

exports.customerSubscribedToPlan = async function(req, res) {
  try {
    const { email, plan } = req.metadata;

    const stripeCustomer = await services.stripe.findCustomer(email);

    if (stripeCustomer && plan) {
      const stripeSubscription = await services.stripe.findSubscription(stripeCustomer, plan);
      if (!stripeSubscription) {
        res.json({ email, registered: false });
        return;
      }
    }

    if (stripeCustomer && stripeCustomer.metadata && stripeCustomer.metadata.vhxCustomerHref) {
      const vhxCustomer = await services.vhx.findCustomer(stripeCustomer.metadata.vhxCustomerHref);
      if (vhxCustomer) {
        res.json({ email, registered: true });
        return;
      }
    }

    res.json({ email, registered: false });
  } catch (err) {
    error.log('controller:customerSubscribedToPlan', err);
    error.send(req, res, err);
  }
};
