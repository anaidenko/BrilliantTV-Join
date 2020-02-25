import React from 'react';
import NoMatchPage from '../pages/NoMatchPage';
import SignupPage from '../pages/SignupPage';

const routes = [
  {
    path: '/',
    exact: true,
    component: SignupPage,
  },
  {
    path: '/pre-purchased',
    component: SignupPage,
  },
  {
    path: '/:plan(monthly|annual|annual-$147|annual-147|yearly|yearly-$147|yearly-147)',
    component: SignupPage,
  },
  {
    component: NoMatchPage,
  },
];

export default routes;
