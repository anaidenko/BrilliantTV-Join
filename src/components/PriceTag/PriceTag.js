// @flow

import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Box } from '@material-ui/core';
import * as formatter from '../../utilities/formatter';
import classNames from 'classnames';

const styles = (theme) => ({
  root: {},
});

type Props = {
  classes: Object,
  amount: Number,
  interval?: string,
};

class PriceTag extends Component<Props> {
  formatInterval(interval: string): string {
    switch (interval) {
      case 'year':
        return 'year';
      case 'month':
        return 'mo';
      case 'day':
        return 'day';
      default:
        return interval;
    }
  }

  render() {
    const { classes: c, amount, interval } = this.props;

    const amountFormatted = formatter.formatCurrency(amount);
    const intervalFormatted = amountFormatted !== '' && interval ? this.formatInterval(interval) : '';

    return (
      <Box component="span" className={classNames(c.root, this.props.className)}>
        {amountFormatted && (
          <>
            {amountFormatted}/{intervalFormatted}
          </>
        )}
      </Box>
    );
  }
}

export default withStyles(styles, { withTheme: true })(PriceTag);
