// @flow

// A Wrapper for the <FormControl>, <InputLabel>, <Error> and the Stripe <*Element>.
// Similar to Material UI's <TextField>. Handles focused, empty and error state
// to correctly show the floating label and error messages etc.

import { FormControl, FormHelperText, InputAdornment, InputLabel, OutlinedInput, withStyles } from '@material-ui/core';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';

import StripeInput from '../StripeInput';

const styles = () => ({
  root: {},
  brandIcon: {
    width: 30,
  },
  input: {
    padding: '18.5px 14px',
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
  classes?: object,
  component: object,
  label: string,
  labelWidth?: number,
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
      error: false,
      brandIcon: '',
    };
  }

  handleBlur = () => {
    this.setState({ focused: false });
  };

  handleFocus = () => {
    this.setState({ focused: true });
  };

  handleChange = changeObject => {
    this.setState({
      error: changeObject.error,
      empty: changeObject.empty,
      brandIcon: this.mapBrandIcon(changeObject.brand),
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
          <InputLabel
            focused={focused}
            shrink={focused || !empty}
            error={!!error || (empty && showError)}
            variant="outlined"
          >
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
                    <i className={['pf', brandIcon].join(' ')} />
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

StripeElementWrapper.defaultProps = {
  brandIcon: false,
  classes: {},
  labelWidth: 0,
  placeholder: '',
  showError: false,
};

StripeElementWrapper.propTypes = {
  component: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
};

export default withStyles(styles, { withTheme: true })(StripeElementWrapper);
