// @flow

import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import { Box } from '@material-ui/core';

import classNames from 'classnames';
import pluralize from 'pluralize';

import PriceTag from '../PriceTag';
import * as formatter from '../../utilities/formatter';

type Props = {
  classes: Object,
  plan: Object,
  coupon: Object,
};

const styles = (theme) => ({
  root: {
    backgroundColor: '#f2f9f1',
    border: '1px dashed green',
    color: 'green',
    fontSize: '16px',
    fontWeight: 600,
    padding: theme.spacing(2),
    textAlign: 'center',
  },
  details: {},
  couponApplied: {
    border: '1px solid green',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    padding: theme.spacing(1, 2),
  },
  originalPrice: {
    marginRight: theme.spacing(2),
  },
  strikethrough: {
    textDecoration: 'line-through',
  },
  salePrice: {
    color: 'red',
  },
});

class CouponApplied extends Component<Props> {
  calculatePriceAfterCoupon(price: number, coupon: Object): number {
    if (coupon.amount_off) {
      return price - coupon.amount_off / 100;
    } else if (coupon.percent_off) {
      return price * (1 - coupon.percent_off / 100);
    } else {
      return price;
    }
  }

  render() {
    const { classes: c, plan, coupon } = this.props;
    if (!plan || !coupon) {
      return <></>;
    }

    const originalPrice = plan.amount / 100;
    const salePrice = this.calculatePriceAfterCoupon(originalPrice, coupon);
    const interval = plan.interval;

    return (
      <Box my={2} align="center" className={c.root}>
        <Box className={c.details}>
          {coupon.amount_off
            ? `${formatter.formatCurrency(coupon.amount_off / 100)} OFF`
            : `${coupon.percent_off}% OFF`}{' '}
          {coupon.duration === 'forever'
            ? ''
            : coupon.duration === 'once'
            ? 'FOR FIRST PAYMENT'
            : coupon.duration === 'repeating'
            ? `FOR NEXT ${pluralize('month', coupon.duration_in_months, true).toUpperCase()}`
            : ''}
        </Box>
        <Box className={c.couponApplied}>COUPON APPLIED</Box>
        <Box className={c.priceContainer}>
          <PriceTag
            className={classNames(c.originalPrice, c.strikethrough)}
            amount={originalPrice}
            interval={interval}
          ></PriceTag>
          <PriceTag className={c.salePrice} amount={salePrice} interval={interval}></PriceTag>
        </Box>
      </Box>
    );
  }
}

export default withStyles(styles, { withTheme: true })(CouponApplied);
