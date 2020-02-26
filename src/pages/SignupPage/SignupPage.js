// @flow

import { Box, Button, Divider, Fab, Grid, Hidden, Paper, Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import React, { Component } from 'react';
import Intercom from 'react-intercom';
import { Elements, StripeProvider } from 'react-stripe-elements';
import classNames from 'classnames';

import CheckoutDetails from '../../components/CheckoutDetails';
import CheckoutForm from '../../components/CheckoutForm';
import Testimonials from '../../components/Testimonials';
import environment from '../../config/environment';

const styles = (theme) => ({
  root: {
    width: 910,
    maxWidth: '97vw',
    margin: theme.spacing(1),
    [theme.breakpoints.up('sm')]: {
      marginTop: theme.spacing(3),
      marginBottom: theme.spacing(8),
    },
  },
  rootCompact: {
    width: 640,
  },
  logo: {
    width: 147,
  },
  header: {
    marginBottom: theme.spacing(3),
  },
  paper: {
    padding: theme.spacing(3, 8),
    borderRadius: 0,
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(3, 3),
    },
  },
  testimonials: {
    marginTop: theme.spacing(6),
  },
  cardHeader: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(4),
    fontWeight: 'bold',
  },
  subHeader1: {
    fontWeight: 'bold',
  },
  divider: {
    height: 'auto',
    margin: theme.spacing(0, 2),
    opacity: 0.5,
  },
  needHelp: {
    color: '#1EB2BB',
    fontWeight: 'bold',
  },
  chatWithSupport: {
    backgroundColor: '#1EB2BB',
    textTransform: 'none',
    '&:hover': {
      backgroundColor: '#0EA2AB',
    },
  },
  intercomFloatingPanel: {
    marginRight: theme.spacing(2),
  },
  chatWithSupportFab: {
    height: 80,
    lineHeight: 1,
    width: 80,
    marginTop: theme.spacing(2),
  },
});

type Props = {
  classes: Object,
  match: Object,
};

type State = {
  planSlug: String,
  planDetails: Object,
  viewSlug: String,
  prePurchased: boolean,
};

class SignupPage extends Component<Props, State> {
  constructor() {
    super();

    this.state = {};
  }

  componentDidMount() {
    const {
      match: { params },
    } = this.props;

    const planSlug = (params.plan || 'yearly').trim().toLowerCase();
    const viewSlug = (params.view || '').trim().toLowerCase();
    const prePurchased = viewSlug === 'pre-purchased';
    const planDetails = environment.plan;

    this.setState({ planSlug, planDetails, viewSlug, prePurchased });
  }

  handleRegisterComplete = () => {
    const { planSlug } = this.state;
    if (['annual-147', 'annual-$147', 'yearly-147', 'yearly-$147'].includes(planSlug)) {
      window.location = `${environment.SIGNUP_THANK_YOU_SITE_URL || 'https://subscribe.brillianttv.com'}/thank-you-97`;
    } else if (planSlug === 'monthly') {
      window.location = `${environment.SIGNUP_THANK_YOU_SITE_URL || 'https://subscribe.brillianttv.com'}/thank-you-20`;
    } else {
      window.location = environment.SIGNUP_SUCCESS_PAGE || 'https://subscribe.brillianttv.com/welcome';
    }
  };

  render() {
    const { classes: c } = this.props;
    const { planSlug, planDetails, prePurchased } = this.state;

    return (
      <Box className={classNames(c.root, prePurchased ? c.rootCompact : null)}>
        {environment.INTERCOM_APP_ID && (
          <Intercom
            appID={environment.INTERCOM_APP_ID}
            custom_launcher_selector=".intercom-launcher"
            hide_default_launcher
          />
        )}

        <Hidden smUp>
          <Box mb={2}>
            <a href="https://subscribe.brillianttv.com/btv-subscription1">
              <img src="/images/BTV_Logo_Dark.png" className={c.logo} alt="logo" />
            </a>
          </Box>
        </Hidden>

        <Grid container className={c.header} direction="row" wrap="nowrap" alignItems="center" justify="center">
          <Hidden only="xs">
            <Grid item align="left">
              <a href="https://subscribe.brillianttv.com/btv-subscription1">
                {' '}
                <img src="/images/BTV_Logo_Dark.png" className={c.logo} alt="logo" />
              </a>
            </Grid>

            <Grid item xs />
          </Hidden>

          {environment.INTERCOM_APP_ID && (
            <>
              <Grid item>
                <Box mr={4}>
                  <Typography variant="h5" className={c.needHelp}>
                    Need Help?
                  </Typography>
                </Box>
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  color="primary"
                  className={[c.chatWithSupport, 'intercom-launcher'].join(' ')}
                  aria-label="click to chat with support"
                >
                  Click to Chat with Support
                </Button>
              </Grid>
            </>
          )}
        </Grid>

        <Paper elevation={3} className={[c.paper, c.checkout].join(' ')}>
          <Typography variant="h5" align="center" className={c.cardHeader}>
            You’re just minutes away from accessing{' '}
            <Hidden only="xs">
              <br />
            </Hidden>
            the entire Brilliant TV Library!
          </Typography>

          <Grid container spacing={2} xs-direction="column">
            <Grid item sm container direction="column" className={c.dividerRight}>
              <StripeProvider apiKey={environment.STRIPE_PUBLISHABLE_KEY}>
                <Elements>
                  <CheckoutForm
                    planSlug={planSlug}
                    plan={planDetails}
                    prePurchased={prePurchased}
                    onComplete={this.handleRegisterComplete}
                  />
                </Elements>
              </StripeProvider>
            </Grid>
            {!prePurchased && (
              <>
                <Divider orientation="vertical" className={c.divider} />
                <Grid item sm container direction="column">
                  <Hidden smUp>
                    <Box mt={2} />
                  </Hidden>
                  <CheckoutDetails plan={planDetails} />
                </Grid>
              </>
            )}
          </Grid>
        </Paper>

        {!prePurchased && (
          <Paper elevation={3} className={[c.paper, c.testimonials].join(' ')}>
            <Typography variant="h5" align="center" className={c.cardHeader}>
              Testimonials
            </Typography>

            <Typography align="center" className={c.subHeader1}>
              The Transformation You’re Desiring Is Closer Than You Think.
            </Typography>

            <Typography align="center" className={c.subHeader2}>
              Brilliant TV Has Helped Thousands Experience Transformational Growth!
            </Typography>

            <Box mt={4}>
              <Testimonials />
            </Box>
          </Paper>
        )}

        {environment.INTERCOM_APP_ID && (
          <Hidden smDown>
            <Box position="fixed" bottom={15} right={0} className={c.intercomFloatingPanel}>
              <Typography variant="h5" className={c.needHelp}>
                Need Help?
              </Typography>
              <Fab
                aria-label="chat with support"
                className={[c.chatWithSupport, c.chatWithSupportFab, 'intercom-launcher'].join(' ')}
                color="primary"
              >
                Chat with
                <br />
                Support
              </Fab>
            </Box>
          </Hidden>
        )}
      </Box>
    );
  }
}

export default withStyles(styles, { withTheme: true })(SignupPage);
