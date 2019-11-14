import { Box, TextField, Typography, withStyles } from '@material-ui/core';
import React from 'react';

const styles = (theme) => ({
  root: {
    '& input': {
      paddingTop: theme.spacing(1),
      paddingBottom: theme.spacing(1),
    },
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
  },
});

function CustomTextField(props) {
  const { classes: c, label } = props;

  return (
    <Box align="left" className={c.root}>
      {label && (
        <Typography variant="subtitle1" className={c.label}>
          {label}
        </Typography>
      )}
      <TextField type="text" variant="filled" {...props} label="" />
    </Box>
  );
}

export default withStyles(styles, { withTheme: true })(CustomTextField);
