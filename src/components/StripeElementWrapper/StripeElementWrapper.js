// @flow

// A Wrapper for the <FormControl>, <InputLabel>, <Error> and the Stripe <*Element>.
// Similar to Material UI's <TextField>. Handles focused, empty and error state
// to correctly show the floating label and error messages etc.

import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';

import { withStyles, InputAdornment, Box, OutlinedInput, InputLabel, FormControl, FormHelperText } from '@material-ui/core';

import StripeInput from '../../components/StripeInput';

const styles = theme => ({
  root: {},
  brandIcon: {
    width: 30
  },
  input: {
    padding: '18.5px 14px'
  }
});

const cardBrandToPfClass = {
  visa: 'pf-visa',
  mastercard: 'pf-mastercard',
  amex: 'pf-american-express',
  discover: 'pf-discover',
  diners: 'pf-diners',
  jcb: 'pf-jcb',
  unknown: 'pf-credit-card'
};

class StripeElementWrapper extends PureComponent {
  static displayName = 'StripeElementWrapper';

  static propTypes = {
    component: PropTypes.func.isRequired,
    label: PropTypes.string.isRequired
  };

  state = {
    focused: false,
    empty: true,
    error: false,
    brandIcon: 'pf-credit-card'
  };

  handleBlur = () => {
    this.setState({ focused: false });
  };

  handleFocus = () => {
    this.setState({ focused: true });
  };

  handleChange = changeObj => {
    this.setState({
      error: changeObj.error,
      empty: changeObj.empty,
      brand: changeObj.brand,
      brandIcon: this.mapBrandIcon(changeObj.brand)
    });
  };

  mapBrandIcon = brand => {
    let pfClass = 'pf-credit-card';
    if (brand in cardBrandToPfClass) {
      pfClass = cardBrandToPfClass[brand];
    }
    return pfClass;
  };

  render() {
    const { component, label, brandIcon: showBrandIcon, labelWidth, classes: c, showError, placeholder } = this.props;
    const { focused, empty, error, brandIcon } = this.state;

    return (
      <div className={c.root}>
        <FormControl fullWidth margin="normal" variant="outlined">
          <InputLabel focused={focused} shrink={focused || !empty} error={!!error || (empty && showError)} variant="outlined">
            {label}
          </InputLabel>
          <OutlinedInput
            className={c.input}
            error={!!error || (empty && showError)}
            fullWidth
            inputComponent={StripeInput}
            inputProps={{ component }}
            labelWidth={labelWidth}
            notched={focused || !empty}
            onBlur={this.handleBlur}
            onChange={this.handleChange}
            onFocus={this.handleFocus}
            placeholder={focused ? placeholder : ''}
            endAdornment={
              showBrandIcon && (
                <InputAdornment position="start">
                  <span className={c.brandIcon}>
                    <i className={['pf', brandIcon].join(' ')}></i>
                  </span>
                </InputAdornment>
              )
            }
          />
        </FormControl>
        {error && <FormHelperText error>{error.message}</FormHelperText>}
      </div>
    );
  }
}

export default withStyles(styles, { withTheme: true })(StripeElementWrapper);
