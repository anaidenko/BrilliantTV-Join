const createError = require('http-errors');
const vhx = require('vhx')(process.env.VHX_API_KEY);
const util = require('util');
const logger = require('./logger.service');

// #region Static Variables

const pendingSignupRequestsByEmail = {};

// #endregion

// #region Public Methods

exports.signup = async (metadata, vhxCustomerHref) => {
  // Reject repeated signup call if there are any pending requests for this user matched by email
  checkRepeatedSignupCallFor(metadata.email);

  // Block signup for requested user (by email) to avoid dupliated charges
  pendingSignupRequestsByEmail[metadata.email] = metadata;

  try {
    let isNewCustomer;
    let customer = vhxCustomerHref ? await findCustomer(vhxCustomerHref) : null;
    if (customer) {
      await subscribeCustomer(metadata, customer);
      isNewCustomer = false;
    } else {
      customer = await createCustomer(metadata);
      isNewCustomer = true;
    }
    return { vhxCustomer: customer, isNewCustomer };
  } finally {
    pendingSignupRequestsByEmail[metadata.email] = null;
  }
};

exports.findCustomer = async (href) => {
  let customer = href ? await findCustomer(href) : null;
  return customer;
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

async function findCustomer(href) {
  try {
    const customer = await util.promisify(vhx.customers.retrieve)(href);
    logger.debug('vhxService.findCustomer', 'VHX customer found', customer);
    return customer;
  } catch (err) {
    logger.error('vhxService.findCustomer', 'Failed to find a customer at VHX side', href, err);
    throw err;
  }
}

async function subscribeCustomer(metadata, vhxCustomer) {
  let addProductMetadata;
  try {
    addProductMetadata = {
      customer: vhxCustomer._links.self.href,
      product: metadata.product,
      plan: metadata.plan,
    };
    const product = await util.promisify(vhx.customers.addProduct)(addProductMetadata);
    logger.debug('vhxService.subscribeCustomer', `Product added to VHX customer ${metadata.email}`, addProductMetadata);
    return product;
  } catch (err) {
    logger.error('vhxService.subscribeCustomer', 'Failed to add a product to VHX customer', addProductMetadata);
    throw err;
  }
}

async function createCustomer(metadata) {
  const customerMetadata = {
    email: metadata.email,
    name: metadata.name,
    product: metadata.product,
    plan: metadata.plan,
    password: metadata.password,
    marketing_opt_in: metadata.marketingOptIn,
  };

  try {
    const customer = await util.promisify(vhx.customers.create)(customerMetadata);
    logger.debug('vhxService.createCustomer', 'VHX customer created', customer);
    return customer;
  } catch (err) {
    logger.error('vhxService.createCustomer', 'Failed to create VHX customer', customerMetadata);
    throw err;
  }
}

// #endregion
