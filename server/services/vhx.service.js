const createError = require('http-errors');
const vhx = require('vhx')(process.env.VHX_API_KEY);
const util = require('util');
const logger = require('./logger.service');

// #region Static Variables

const pendingSignupRequestsByEmail = {};

// #endregion

// #region Public Methods

exports.signupAtVhx = async (metadata, vhxCustomerHref) => {
  // Reject repeated signup call if there are any pending requests for this user matched by email
  checkRepeatedSignupCallFor(metadata.email);

  // Block signup for requested user (by email) to avoid dupliated charges
  pendingSignupRequestsByEmail[metadata.email] = metadata;

  try {
    let newCustomer;
    let vhxCustomer = vhxCustomerHref ? await findVhxCustomer(vhxCustomerHref) : null;
    if (vhxCustomer) {
      await subscribeVhxCustomer(metadata, vhxCustomer);
      newCustomer = false;
    } else {
      vhxCustomer = await createVhxCustomer(metadata);
      newCustomer = true;
    }
    return { vhxCustomer, newCustomer };
  } finally {
    pendingSignupRequestsByEmail[metadata.email] = null;
  }
};

// #endregion

// #region Private Helpers

function checkRepeatedSignupCallFor(email) {
  if (pendingSignupRequestsByEmail[email]) {
    throw createError(
      400,
      "Please wait, request to signup was already sent and is being processed. You won't be charged twice for registration.",
    );
  }
}

async function findVhxCustomer(href) {
  try {
    const vhxCustomer = await util.promisify(vhx.customers.retrieve)(href);
    logger.debug('vhxService.findVhxCustomer', 'VHX customer found', vhxCustomer);
    return vhxCustomer;
  } catch (err) {
    logger.error('vhxService.findVhxCustomer', 'Failed to find a customer at VHX side', href, err);
    throw err;
  }
}

async function subscribeVhxCustomer(metadata, vhxCustomer) {
  let vhxAddProductMetadata;
  try {
    vhxAddProductMetadata = {
      customer: vhxCustomer._links.self.href,
      product: metadata.product,
      plan: metadata.plan,
    };
    const vhxProduct = await util.promisify(vhx.customers.addProduct)(vhxAddProductMetadata);
    logger.debug(
      'services.subscribeVhxCustomer',
      `Product added to VHX customer ${metadata.email}`,
      vhxAddProductMetadata,
    );
    return vhxCustomer;
  } catch (err) {
    logger.error('vhxService.subscribeVhxCustomer', 'Failed to add a product to VHX customer', vhxAddProductMetadata);
    throw err;
  }
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
    logger.debug('vhxService.createVhxCustomer', 'VHX customer created', vhxCustomer);
    return vhxCustomer;
  } catch (err) {
    logger.error('vhxService.createVhxCustomer', 'Failed to create VHX customer', vhxCustomerMetadata);
    throw err;
  }
}

// #endregion
