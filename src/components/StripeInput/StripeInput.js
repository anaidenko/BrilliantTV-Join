// @flow

// Wrapper around the actual Stripe <*Element>, so that it can be used as `inputComponent`
// for Material UI's <Input>. Also adds some styling.

import { withStyles } from '@material-ui/core';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';

const styles = () => ({
  root: {
    width: '100%',
    cursor: 'text',
  },
});

type Props = {
  inputRef?: Function,
  placeholder?: string,
};

class StripeInput extends PureComponent<Props> {
  render() {
    const { inputRef, classes: c, theme, component: Component, onFocus, onBlur, onChange, placeholder } = this.props;

    return (
      <Component
        className={c.root}
        onFocus={onFocus}
        onBlur={onBlur}
        onChange={onChange}
        placeholder={placeholder}
        ref={reference => {
          inputRef(reference ? reference.getElement() : null);
        }}
        style={{
          base: {
            fontSize: `${theme.typography.fontSize}px`,
            fontFamily: theme.typography.fontFamily,
            color: '#000000de',
          },
        }}
      />
    );
  }
}

StripeInput.defaultProps = {
  inputRef: () => {},
  onBlur: () => {},
  onChange: () => {},
  onFocus: () => {},
  placeholder: '',
};

StripeInput.propTypes = {
  classes: PropTypes.object.isRequired,
  theme: PropTypes.object.isRequired,
  component: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  onChange: PropTypes.func,
};

export default withStyles(styles, { withTheme: true })(StripeInput);
