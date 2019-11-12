// @flow

import { Grid, Hidden, withStyles } from '@material-ui/core';
import React, { PureComponent } from 'react';
import { CardCVCElement, CardExpiryElement, CardNumberElement } from 'react-stripe-elements';

import StripeElementWrapper from '../StripeElementWrapper';

const styles = (theme) => ({
  root: {
    flexWrap: 'nowrap',
  },
  grid: {
    marginBottom: theme.spacing(2),
    flexWrap: 'nowrap',
  },
  gridItem: {
    marginRight: theme.spacing(1),
    '&:last-of-type': {
      marginRight: 0,
    },
  },
});

type Props = {
  classes: Object,
  showError: boolean,
};

class StripeCardsSection extends PureComponent<Props> {
  render() {
    const { classes: c, showError } = this.props;

    return (
      <Grid container className={c.root} direction="column">
        <Grid item xs={12} className={c.grid}>
          <StripeElementWrapper
            label="Credit Card Number"
            placeholder="0000 0000 0000 0000"
            component={CardNumberElement}
            brandIcon
            showError={showError}
          />
        </Grid>
        <Grid item container className={c.grid}>
          <Grid item xs={5} className={c.gridItem}>
            <StripeElementWrapper
              label="Expiration Date"
              placeholder="MM / YY"
              component={CardExpiryElement}
              showError={showError}
            />
          </Grid>
          <Grid item xs={1} implementation="css" component={Hidden} className={c.gridItem} />
          <Grid item xs={6} className={c.gridItem}>
            <StripeElementWrapper
              label="CVC Number"
              placeholder="000"
              component={CardCVCElement}
              showError={showError}
            />
          </Grid>
        </Grid>
      </Grid>
    );
  }
}

export default withStyles(styles, { withTheme: true })(StripeCardsSection);
