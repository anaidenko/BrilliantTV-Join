import NoMatchPage from '../pages/NoMatchPage';
import SignupPage from '../pages/SignupPage';

const planParam = ':plan(monthly|annual|annual-$147|annual-147|yearly|yearly-$147|yearly-147)';

const routes = [
  {
    path: '/',
    exact: true,
    component: SignupPage,
  },
  {
    path: `/:view(pre-purchased)/${planParam}`,
    exact: true,
    component: SignupPage,
  },
  {
    path: `/${planParam}`,
    exact: true,
    component: SignupPage,
  },
  {
    component: NoMatchPage,
  },
];

export default routes;
