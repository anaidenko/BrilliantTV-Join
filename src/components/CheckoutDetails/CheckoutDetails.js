// @flow

import { Box, List, ListItem, ListItemIcon, ListItemText, Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import React, { Component } from 'react';

import environment from '../../config/environment';
import { CheckIcon } from '../../icons';

const styles = (theme) => ({
  root: {},
  featuresList: {
    '& .MuiListItem-dense': {
      paddingTop: 0,
      paddingBottom: 0,
    },
    '& .MuiListItemText-dense': {
      margin: 0,
    },
    '& .MuiListItemIcon-root': {
      minWidth: 0,
      marginRight: theme.spacing(1),
    },
  },
  priceTag: {
    fontWeight: 'bold',
  },
  totalValue: {
    fontWeight: 'bold',
    margin: theme.spacing(1),
  },
  todayPrice: {
    color: '#EA0000',
    marginBottom: theme.spacing(2),
  },
  moneyBackGuarantee: {
    lineHeight: 1.1,
    margin: theme.spacing(1),
  },
  refundNote: {
    fontSize: 10,
  },
  joinGrahamText: {
    fontSize: 17,
  },
});

type Props = {
  classes: Object,
  plan: Object,
  match: Object,
};

type State = {
  features: Object[],
  plan: string,
  price: string,
  interval: string,
};

class CheckoutDetails extends Component<Props, State> {
  constructor() {
    super();

    this.state = {
      ...this.state,
      features: [
        { name: 'Exclusive, weekly mentoring videos', price: '$4375' },
        { name: 'Access the entire Brilliant TV Library', price: '$1900' },
        { name: 'Printable PDF activation guides', price: '$40' },
        { name: 'Enrollment in Immersion Courses', price: '$150' },
        { name: 'Access 60+ Conference Sessions', price: '$160' },
      ],
    };
  }

  componentDidMount() {
    const {
      match: { params },
    } = this.props;

    const plan = (params.plan || 'yearly').trim().toLowerCase();
    const price = this.formatCurrency(environment.plan.amount / 100);
    const interval = this.formatInterval(environment.plan.interval);

    this.setState({ plan, price, interval });
  }

  formatInterval = (interval) => {
    switch (interval) {
      case 'year':
        return 'year';
      case 'month':
        return 'mo';
      default:
        return interval;
    }
  };

  formatCurrency = (input: number | string): string => {
    const value = typeof input === 'string' ? Number(input) : input;
    if (typeof value !== 'number' || Number.isNaN(value)) {
      return '';
    }
    const formattedValue = `$${value.toFixed(2).replace(/[,.]00$/, '')}`;
    return formattedValue;
  };

  renderFeatureItem(feature, key) {
    const { classes: c } = this.props;
    return (
      <ListItem dense disableGutters key={key}>
        <ListItemIcon>
          <CheckIcon />
        </ListItemIcon>
        <ListItemText
          primary={
            <span>
              {feature.name}{' '}
              <Typography component="span" className={c.priceTag}>
                {feature.price} Value
              </Typography>
            </span>
          }
        />
      </ListItem>
    );
  }

  render() {
    const { classes: c } = this.props;
    const { features, price, interval } = this.state;

    return (
      <Box>
        <Typography variant="h6" align="left" className={c.joinGrahamText}>
          Join Graham’s mentoring community and receive:
        </Typography>
        <List component="ul" className={c.featuresList}>
          {features.map((feature, i) => this.renderFeatureItem(feature, i))}
        </List>
        <Typography variant="h6" className={c.totalValue}>
          Total Value of $6,545+
        </Typography>
        <Box mt={2} mb={4}>
          <Typography>Access everything for only</Typography>
          <Typography variant="h6" className={c.todayPrice}>
            Today only {price}/{interval}
          </Typography>
        </Box>
        <img src="/images/Satisfaction_Guaranteed.png" width="218" height="184" alt="satisfaction guaranteed" />
        <Typography variant="h6" className={c.moneyBackGuarantee} color="primary">
          30 Day Money-Back
          <br />
          Transformational Guarantee
        </Typography>
        <Typography className={c.refundNote}>
          If you do not experience any growth in your relationship with God, simply notify us within 30 days and you’ll
          get a full refund! No questions asked.
        </Typography>
      </Box>
    );
  }
}

export default withStyles(styles, { withTheme: true })(CheckoutDetails);
