// @flow

import { Box, Button, Checkbox, FormControlLabel, Grid, Link, Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import React, { Component } from 'react';
import { InjectedProps, injectStripe } from 'react-stripe-elements';
import validate from 'validate.js';
import validator from 'validator';

import environment from '../../config/environment';
import { PadlockIcon } from '../../icons';
import constraints from '../../services/validation/constraints';
import CouponApplied from '../CouponApplied';
import FeedbackSnackbarContent from '../FeedbackSnackbarContent';
import StripeCardsSection from '../StripeCardsSection';
import TextField from '../TextField';

type Props = InjectedProps & {
  onComplete: Function,
  planSlug: string,
  plan: Object,
};

type State = {
  emailAddress: string,
  fullName: string,
  password: string,
  passwordConfirmation: string,
  couponCode: string,
  couponDetails: Object,
  marketingOptIn: boolean,

  performingAction: boolean,
  errors: Object,
  serverError: string,
  showErrors: boolean,
};

const styles = (theme) => ({
  root: {
    '& small': {
      fontSize: 12,
    },
  },
  grid: {
    marginBottom: theme.spacing(2),
  },
  gridPayment: {
    marginTop: theme.spacing(2),
  },
  formHeader: {
    textAlign: 'left',
    marginBottom: theme.spacing(2),
  },
  marketingOptIn: {
    fontWeight: 600,
  },
  couponCodeContainer: {
    alignItems: 'flex-start',
  },
  applyCouponContainer: {
    alignSelf: 'flex-start',
    display: 'flex',
    marginTop: 22,
    marginLeft: theme.spacing(2),
  },
  feedback: {
    textAlign: 'left',
  },
  register: {
    backgroundColor: '#35BA0D',
    fontSize: '18px',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(3),
    textTransform: 'none',
  },
  link: {
    fontWeight: 'bold',
  },
  errorLink: {
    fontWeight: 'bold',
    color: 'inherit',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },
  login: {
    marginTop: theme.spacing(3),
  },
  padlock: {
    marginBottom: -2,
    marginRight: 4,
  },
  paymentTypeIcon: {
    width: 35,
    marginLeft: theme.spacing(1),
    '&:first-of-type': {
      marginLeft: 0,
    },
  },
});

class CheckoutForm extends Component<Props, State> {
  constructor() {
    super();

    this.state = {
      emailAddress: '',
      fullName: '',
      password: '',
      passwordConfirmation: '',
      couponCode: '',
      couponDetails: null,
      marketingOptIn: false,

      performingAction: false,
      errors: null,
      serverError: '',
      showErrors: false,
    };
  }

  handleApplyCouponClick = async () => {
    const { couponCode, couponDetails } = this.state;

    if (!couponCode || (couponDetails && couponCode === couponDetails.id)) {
      return;
    }

    this.setState(
      {
        performingAction: true,
        couponDetails: null,
        serverError: '',
      },
      async () => {
        const response = await fetch(`${environment.REACT_APP_BACKEND_URL}/coupon/${encodeURIComponent(couponCode)}`, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
        });

        if (response.ok) {
          const content = await response.json();
          this.setState({ performingAction: false, couponDetails: content });
        } else {
          await this.handleError(response, 'Coupon Error');
        }
      },
    );
  };

  handleRegisterClick = () => {
    const errors = this.validateForm();

    if (errors) {
      this.setState({
        errors,
        showErrors: true,
      });
    } else {
      this.setState(
        {
          performingAction: true,
          errors: null,
          serverError: '',
          showErrors: true,
        },
        async () => {
          const { prePurchased, planSlug, stripe, onComplete } = this.props;
          const { fullName, emailAddress, password, couponCode, marketingOptIn } = this.state;
          const { token } = prePurchased ? {} : await stripe.createToken({ name: fullName });

          if (!prePurchased && !token) {
            this.setState({ performingAction: false });
            return;
          }

          const metadata = {
            stripeToken: !prePurchased ? token.id : null,
            name: fullName,
            email: emailAddress,
            password,
            couponCode: !prePurchased ? couponCode : null,
            marketingOptIn,
            plan: planSlug,
            prePurchased,
          };
          const response = await fetch(`${environment.REACT_APP_BACKEND_URL}/signup`, {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(metadata),
          });
          if (response.ok) {
            const content = await response.json();
            console.log('Signup Succeed', content);
            if (onComplete) {
              onComplete();
            }
          } else {
            await this.handleError(response);
          }
        },
      );
    }
  };

  handleFieldChange = (fieldName) => (event) => {
    const { showErrors } = this.state;
    const { value } = event.target;
    this.setState({ [fieldName]: value }, () => {
      if (showErrors) {
        this.validateField(fieldName, value);
      }
    });
  };

  handleCouponFieldKeyDown = (event) => {
    if (event.key === 'Enter') {
      this.handleApplyCouponClick();
    } else if (event.key === 'Escape') {
      this.setState({ couponCode: '' });
    }
  };

  handleFieldCheck = (fieldName) => (event) => {
    const { showErrors } = this.state;
    const value = event.target.checked;
    this.setState({ [fieldName]: value }, () => {
      if (showErrors) {
        this.validateField(fieldName, value);
      }
    });
  };

  validateForm = () => {
    const { fullName, emailAddress, password, passwordConfirmation } = this.state;

    const errors = validate(
      {
        fullName,
        emailAddress,
        password,
        passwordConfirmation,
      },
      {
        fullName: constraints.fullName,
        emailAddress: constraints.emailAddress,
        password: constraints.password,
        passwordConfirmation: constraints.passwordConfirmation,
      },
    );

    return errors;
  };

  validateField = (fieldName, fieldValue) => {
    switch (fieldName) {
      case 'password':
      case 'passwordConfirmation': {
        const { errors, password, passwordConfirmation } = this.state;
        const newErrors =
          validate(
            { password, passwordConfirmation },
            {
              password: constraints.password,
              passwordConfirmation: constraints.passwordConfirmation,
            },
          ) || {};
        this.setState({
          errors: {
            ...errors,
            password: newErrors.password,
            passwordConfirmation: newErrors.passwordConfirmation,
          },
        });
        return;
      }
      default: {
        const { errors } = this.state;
        const newErrors = validate({ [fieldName]: fieldValue }, { [fieldName]: constraints[fieldName] }) || {};
        this.setState({ errors: { ...errors, [fieldName]: newErrors[fieldName] } });
      }
    }
  };

  handleFeedbackClose = () => {
    this.setState({ serverError: '' });
  };

  async handleError(response, tag) {
    let errorMessage, error, innerError;
    try {
      const content = await response.json();
      errorMessage = (content && content.message) || response.statusText;
      error = this.formatError(errorMessage);
    } catch (err) {
      innerError = err;
      errorMessage = 'Server Error. Please try again later.';
      error = errorMessage;
    }
    console.error(tag, errorMessage, innerError || '');
    this.setState({ performingAction: false, serverError: error });
  }

  formatError = (error: string): string => {
    const c = this.props.classes;
    error = this.formatLinks(error, { class: c.errorLink, target: '_blank' });
    return error;
  };

  formatLinks = (message: string, props): any => {
    if (!message) {
      return message;
    }
    const parts = String(message).split(/\b([^\s]+?@[^\s]+)\b/gi);
    const result = parts.map((part) => {
      if (validator.isEmail(part)) {
        return (
          <Link href={`mailto:${part}`} {...props}>
            {part}
          </Link>
        );
      }
      return part;
    });
    return result;
  };

  render() {
    const { classes: c, plan, prePurchased } = this.props;

    const {
      performingAction,

      fullName,
      emailAddress,
      password,
      passwordConfirmation,
      couponCode,
      couponDetails,
      marketingOptIn,

      errors,
      serverError,
      showErrors,
    } = this.state;

    return (
      <form className={c.root} onSubmit={(e) => e.preventDefault()}>
        <Typography align="left" variant="h6" color="primary" className={c.formHeader}>
          BrilliantTV Account Information
        </Typography>

        <Grid item container direction="column" className={c.grid}>
          <Grid item className={c.grid}>
            <TextField
              className={c.textField}
              disabled={performingAction}
              error={!!(errors && errors.fullName)}
              fullWidth
              helperText={errors && errors.fullName ? errors.fullName[0] : ''}
              label="Your Full Name"
              onChange={this.handleFieldChange('fullName')}
              placeholder="Your Name Here"
              required
              type="text"
              value={fullName}
              variant="filled"
            />
          </Grid>
          <Grid item className={c.grid}>
            <TextField
              className={c.textField}
              disabled={performingAction}
              error={!!(errors && errors.emailAddress)}
              fullWidth
              helperText={errors && errors.emailAddress ? errors.emailAddress[0] : ''}
              label="Your Email Address"
              onChange={this.handleFieldChange('emailAddress')}
              placeholder="Your Email Address Here"
              required
              type="email"
              value={emailAddress}
              variant="filled"
            />
          </Grid>
          <Grid item className={c.grid}>
            <TextField
              autoComplete="new-password"
              className={c.textField}
              disabled={performingAction}
              error={!!(errors && errors.password)}
              fullWidth
              helperText={errors && errors.password ? errors.password[0] : ''}
              label="Set your BrilliantTV password"
              onChange={this.handleFieldChange('password')}
              placeholder="Your Password"
              required
              type="password"
              value={password}
              variant="filled"
            />
          </Grid>
          <Grid item className={c.grid}>
            <TextField
              autoComplete="new-password"
              className={c.textField}
              disabled={performingAction}
              error={!!(errors && errors.passwordConfirmation)}
              fullWidth
              helperText={errors && errors.passwordConfirmation ? errors.passwordConfirmation[0] : ''}
              label="Confirm your password"
              onChange={this.handleFieldChange('passwordConfirmation')}
              placeholder="Repeat Password"
              required
              type="password"
              value={passwordConfirmation}
              variant="filled"
            />
          </Grid>
        </Grid>

        {!prePurchased && (
          <>
            <Typography variant="h6" color="primary" className={c.formHeader}>
              Payment Information
            </Typography>

            <Grid item container direction="column" className={c.grid}>
              <StripeCardsSection showError={showErrors} />
            </Grid>

            <Grid item container direction="row" className={classNames(c.grid, c.couponCodeContainer)}>
              <Grid item xs>
                <TextField
                  className={c.textField}
                  disabled={performingAction}
                  fullWidth
                  label="Coupon Code (optional)"
                  onChange={this.handleFieldChange('couponCode')}
                  onKeyDown={this.handleCouponFieldKeyDown}
                  readOnly={performingAction}
                  type="text"
                  value={couponCode}
                  variant="filled"
                />
              </Grid>
              <Grid item className={c.applyCouponContainer}>
                <Button
                  aria-label="click to apply coupon code"
                  className={c.applyCoupon}
                  color="secondary"
                  disabled={
                    !couponCode ||
                    (couponCode && couponDetails && couponCode.toUpperCase() === couponDetails.id.toUpperCase()) ||
                    performingAction
                  }
                  onClick={this.handleApplyCouponClick}
                  variant="contained"
                >
                  Apply
                </Button>
              </Grid>
            </Grid>

            <CouponApplied plan={plan} coupon={couponDetails} />
          </>
        )}

        {serverError && (
          <Box my={2}>
            <FeedbackSnackbarContent
              className={c.feedback}
              variant="error"
              message={serverError}
              onClose={this.handleFeedbackClose}
            />
          </Box>
        )}

        {!prePurchased && (
          <Button
            className={c.register}
            color="secondary"
            disabled={!fullName || !emailAddress || !password || !passwordConfirmation || performingAction}
            fullWidth
            onClick={this.handleRegisterClick}
            size="large"
            variant="contained"
            aria-label="click to submit payment"
          >
            Submit Payment
          </Button>
        )}

        <Grid item className={c.grid}>
          <FormControlLabel
            disabled={performingAction}
            control={
              <Checkbox
                checked={marketingOptIn}
                value="marketingOptIn"
                color="secondary"
                onChange={this.handleFieldCheck('marketingOptIn')}
              />
            }
            label={
              <Typography color="textSecondary" variant="body2" align="left" className={c.marketingOptIn}>
                I agree to receive newsletters and product updates from Brilliant TV
              </Typography>
            }
          />
        </Grid>

        {prePurchased && (
          <Button
            className={c.register}
            color="secondary"
            disabled={!fullName || !emailAddress || !password || !passwordConfirmation || performingAction}
            fullWidth
            onClick={this.handleRegisterClick}
            size="large"
            variant="contained"
            aria-label="click to register"
          >
            Register
          </Button>
        )}

        {!prePurchased && (
          <>
            <Box spacing={2}>
              <img src="/icons/payment/visa.png" className={c.paymentTypeIcon} alt="visa card" />
              <img src="/icons/payment/mastercard.png" className={c.paymentTypeIcon} alt="master card" />
              <img
                src="/icons/payment/american-express.png"
                className={c.paymentTypeIcon}
                alt="americal express card"
              />
              <img src="/icons/payment/discover.png" className={c.paymentTypeIcon} alt="discover card" />
            </Box>

            <Typography color="textSecondary" component="small">
              <PadlockIcon className={c.padlock} height="12" />
              100% Safe &amp; Secure Payment
            </Typography>
          </>
        )}
      </form>
    );
  }
}

export default injectStripe(withStyles(styles, { withTheme: true })(CheckoutForm));
