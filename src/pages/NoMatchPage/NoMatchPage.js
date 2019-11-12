import React from 'react';

const NoMatchPage = ({ location }) => (
  <div>
    <h3>
      Sorry, page not found at <code>{location.pathname}</code>
    </h3>
  </div>
);

export default NoMatchPage;
