// @flow

import { Box } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import classNames from 'classnames';
import React, { Component } from 'react';

import * as formatter from '../../utilities/formatter';

const styles = () => ({
  root: {},
});

type Props = {
  classes: Object,
  className: String,
  amount: Number | String,
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
    const { classes: c, className, amount, interval } = this.props;

    const amountFormatted = formatter.formatCurrency(amount);
    const intervalFormatted = amountFormatted !== '' && interval ? this.formatInterval(interval) : '';

    return (
      <Box component="span" className={classNames(c.root, className)}>
        {amountFormatted && (
          <>
            {amountFormatted}/{intervalFormatted}
          </>
        )}
      </Box>
    );
  }
}

PriceTag.defaultProps = {
  interval: '',
};

export default withStyles(styles, { withTheme: true })(PriceTag);
