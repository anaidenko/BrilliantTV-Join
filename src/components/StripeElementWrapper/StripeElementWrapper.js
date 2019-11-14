// @flow

// A Wrapper for the <FormControl>, <InputLabel>, <Error> and the Stripe <*Element>.
// Similar to Material UI's <TextField>. Handles focused, empty and error state
// to correctly show the floating label and error messages etc.

import {
  Box,
  FilledInput,
  FormControl,
  FormHelperText,
  InputAdornment,
  Typography,
  withStyles,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';

import StripeInput from '../StripeInput';

const styles = () => ({
  root: {},
  brandIcon: {
    width: 30,
  },
  formControl: {
    margin: 0,
  },
  label: {
    fontSize: 13,
    fontWeight: 600,
  },
  input: {
    padding: '8px 12px 10px 12px',
  },
});

const cardBrandToPfClass = {
  visa: 'pf-visa',
  mastercard: 'pf-mastercard',
  amex: 'pf-american-express',
  discover: 'pf-discover',
  diners: 'pf-diners',
  jcb: 'pf-jcb',
  unknown: 'pf-credit-card',
};

type Props = {
  brandIcon?: boolean,
  classes: Object,
  component: Object,
  label: string,
  placeholder?: string,
  showError?: boolean,
};

type State = {
  brandIcon: string,
  empty: boolean,
  error: string,
  focused: boolean,
};

class StripeElementWrapper extends PureComponent<Props, State> {
  constructor() {
    super();

    this.state = {
      focused: false,
      empty: true,
      error: '',
      brandIcon: '',
    };
  }

  handleBlur = () => {
    this.setState({ focused: false });
  };

  handleFocus = () => {
    this.setState({ focused: true });
  };

  handleChange = (changeObject) => {
    this.setState({
      error: changeObject.error,
      empty: changeObject.empty,
      brandIcon: this.mapBrandIcon(changeObject.brand),
    });
  };

  mapBrandIcon = (brand) => {
    let pfClass = 'pf-credit-card';
    if (brand in cardBrandToPfClass) {
      pfClass = cardBrandToPfClass[brand];
    }
    return pfClass;
  };

  render() {
    const { component, label, brandIcon: showBrandIcon, classes: c, showError, placeholder } = this.props;
    const { focused, empty, error, brandIcon } = this.state;

    return (
      <Box className={c.root} align="left">
        {label && (
          <Typography variant="subtitle1" className={c.label}>
            {label}
          </Typography>
        )}
        <FormControl fullWidth variant="filled" className={c.formControl}>
          <FilledInput
            className={c.input}
            error={!!error || (empty && showError)}
            fullWidth
            inputComponent={StripeInput}
            inputProps={{ component }}
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            onFocus={this.handleFocus}
            placeholder={focused ? placeholder : ''}
            endAdornment={
              showBrandIcon && (
                <InputAdornment>
                  <span className={c.brandIcon}>
                    <i className={['pf', brandIcon].join(' ')} />
                  </span>
                </InputAdornment>
              )
            }
          />
        </FormControl>
        {error && <FormHelperText error>{error.message}</FormHelperText>}
      </Box>
    );
  }
}

StripeElementWrapper.defaultProps = {
  brandIcon: false,
  placeholder: '',
  showError: false,
};

StripeElementWrapper.propTypes = {
  component: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
};

export default withStyles(styles, { withTheme: true })(StripeElementWrapper);
