// @flow

import React from 'react';

const NoMatch = ({ location }) => (
  <div>
    <h3>
      Sorry, page not found at <code>{location.pathname}</code>
    </h3>
  </div>
);

export default NoMatch;
