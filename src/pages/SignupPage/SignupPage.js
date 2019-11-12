import { Box, Divider, Grid, Paper, Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import React from 'react';
import { Elements, StripeProvider } from 'react-stripe-elements';

import CheckoutDetails from '../../components/CheckoutDetails';
import CheckoutForm from '../../components/CheckoutForm';
import Testimonials from '../../components/Testimonials';
import environment from '../../config/environment';

const styles = (theme) => ({
  root: {
    width: 910,
    marginTop: theme.spacing(3),
    marginBottom: theme.spacing(8),
  },
  logo: {
    width: 147,
  },
  paper: {
    padding: theme.spacing(3, 8),
    borderRadius: 0,
  },
  testimonials: {
    marginTop: theme.spacing(6),
  },
  header: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(4),
    fontWeight: 'bold',
  },
  subHeader1: {
    fontWeight: 'bold',
  },
  divider: {
    borderRight: '1px solid #7B8B9F0F',
    height: 'auto',
    margin: theme.spacing(0, 2),
    opacity: 0.5,
  },
});

function SignupPage(props) {
  const { classes: c, match } = props;
  return (
    <Box className={c.root}>
      <Box mb={3} align="left">
        <img src="/images/BTV_Logo_Dark.png" className={c.logo} alt="logo" />
      </Box>

      <Paper elevation={3} className={[c.paper, c.checkout]}>
        <Typography variant="h5" align="center" className={c.header}>
          You’re just minutes away from accessing
          <br />
          The entire Brilliant TV Library!
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs container direction="column" className={c.dividerRight}>
            <StripeProvider apiKey={environment.STRIPE_PUBLISHABLE_KEY}>
              <Elements>
                <CheckoutForm match={match} />
              </Elements>
            </StripeProvider>
          </Grid>
          <Divider orientation="vertial" className={c.divider} />
          <Grid item xs container direction="column">
            <CheckoutDetails />
          </Grid>
        </Grid>
      </Paper>

      <Paper elevation={3} className={[c.paper, c.testimonials]}>
        <Typography variant="h5" align="center" className={c.header}>
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
    </Box>
  );
}

export default withStyles(styles, { withTheme: true })(SignupPage);
