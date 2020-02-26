// @flow

import { Box, List, ListItem, ListItemIcon, ListItemText, Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import React, { Component } from 'react';

import { CheckIcon } from '../../icons';
import PriceTag from '../PriceTag';

const styles = (theme) => ({
  root: {
    marginRight: theme.spacing(-1),
  },
  featuresList: {
    '& .MuiListItem-dense': {
      alignItems: 'flex-start',
      marginBottom: 8,
      paddingTop: 0,
      paddingBottom: 0,
    },
    '& .MuiListItemText-dense': {
      display: 'flex',
      margin: 0,
    },
    '& .MuiListItemIcon-root': {
      minWidth: 0,
      marginRight: theme.spacing(1),
      marginTop: 4,
    },
  },
  priceTag: {
    fontWeight: 'bold',
  },
  totalValue: {
    fontWeight: 'bold',
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(3),
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
};

type State = {
  features: Object[],
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
    const { classes: c, plan } = this.props;
    const { features } = this.state;

    return (
      <Box className={c.root}>
        <Typography variant="h6" align="left" className={c.joinGrahamText}>
          Join Graham’s mentoring community and receive:
        </Typography>
        <List component="ul" className={c.featuresList}>
          {features.map((feature, i) => this.renderFeatureItem(feature, i))}
        </List>
        <Typography variant="h6" className={c.totalValue}>
          Total Value of $6,545+
        </Typography>
        {plan && (
          <Box mt={2} mb={4}>
            <Typography>Access everything for only</Typography>
            <Typography variant="h6" className={c.todayPrice}>
              Today only <PriceTag amount={plan.amount / 100} interval={plan.interval} />
            </Typography>
          </Box>
        )}
        <img src="/images/Satisfaction_Guaranteed.png" width="218" height="184" alt="satisfaction guaranteed" />
        <Typography variant="h6" className={c.moneyBackGuarantee} color="primary">
          30 Day Money-Back
          <br />
          Transformational Guarantee
        </Typography>
        <Typography className={c.refundNote}>
          If you do not experience any growth in your relationship with God, simply notify us within 30 days and you’ll
          get a full refund! No questions asked..
        </Typography>
      </Box>
    );
  }
}

export default withStyles(styles, { withTheme: true })(CheckoutDetails);
