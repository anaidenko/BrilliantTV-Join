// @flow

import React, { PureComponent } from 'react';

import { withStyles, Grid } from '@material-ui/core';
import { Elements, CardElement, CardNumberElement, CardExpiryElement, CardCVCElement, PostalCodeElement } from 'react-stripe-elements';

import StripeElementWrapper from '../../components/StripeElementWrapper';

const styles = theme => ({
  root: {
    flexWrap: 'nowrap'
  },
  grid: {
    marginRight: theme.spacing(1),
    '&:last-of-type': {
      marginRight: 0
    }
  }
});

class StripeCardsSection extends PureComponent {
  static displayName = 'StripeCardsSection';

  render() {
    const { classes: c, showError } = this.props;

    return (
      <Grid container className={c.root}>
        <Grid item xs className={c.grid}>
          <StripeElementWrapper
            label="Card number"
            labelWidth={95}
            placeholder="0000 0000 0000 0000"
            component={CardNumberElement}
            brandIcon
            showError={showError}
          />
        </Grid>
        <Grid item xs={4} className={c.grid}>
          <StripeElementWrapper label="Expiry" labelWidth={40} placeholder="MM / YY" component={CardExpiryElement} showError={showError} />
        </Grid>
        <Grid item xs={2} className={c.grid}>
          <StripeElementWrapper label="CVC" labelWidth={30} placeholder="000" component={CardCVCElement} showError={showError} />
        </Grid>
      </Grid>
    );
  }
}

export default withStyles(styles, { withTheme: true })(StripeCardsSection);
