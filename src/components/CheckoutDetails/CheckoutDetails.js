// @flow

import { Box, List, ListItem, ListItemIcon, ListItemText, Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import React, { Component } from 'react';

import { CheckIcon } from '../../icons';

const styles = (theme) => ({
  root: {},
  featuresList: {
    '& .MuiListItem-dense': {
      paddingTop: 0,
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
    lineHeight: 1,
    margin: theme.spacing(1),
  },
  refundNote: {
    fontSize: 10,
  },
});

type Props = {
  classes: Object,
};

type State = {
  features: Object[],
};

class CheckoutDetails extends Component<Props, State> {
  constructor() {
    super();

    this.state = {
      features: [
        { name: 'Join weekly inner circle mentoring', price: '$4375' },
        { name: 'Access the entire Brilliant TV Library', price: '$1900' },
        { name: 'Printable PDF activation guides', price: '$40' },
        { name: 'Enrollment in Immersion Courses', price: '$150' },
        { name: 'Access 60+ Conference Sessions', price: '$160' },
      ],
    };
  }

  renderFeatureItem(feature, key) {
    const { classes: c } = this.props;
    return (
      <ListItem dense disableGutters className={c.featureItem} key={key}>
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
    const { features } = this.state;

    return (
      <Box>
        <Typography variant="h6" align="left">
          Here’s what’s included:
        </Typography>
        <List component="ul" className={c.featuresList}>
          {features.map((feature, i) => this.renderFeatureItem(feature, i))}
        </List>
        <Typography variant="h6" className={c.totalValue}>
          Total Value of $6,545+
        </Typography>
        <Typography>Access everything for only</Typography>
        <Typography variant="h6" className={c.todayPrice}>
          Today only $19/mo
        </Typography>
        <img src="/images/Satisfaction_Guaranteed.png" width="218" height="184" alt="satisfaction guaranteed" />
        <Typography variant="h6" className={c.moneyBackGuarantee} color="primary">
          30 Day Money-Back
          <br />
          Transformational Guarantee
        </Typography>
        <Typography className={c.refundNote}>If after 30 days you don’t feel change, we’ll refund you.</Typography>
      </Box>
    );
  }
}

export default withStyles(styles, { withTheme: true })(CheckoutDetails);
