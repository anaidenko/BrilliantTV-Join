require('./config');

const app = require('./app');
const logger = require('./logger');

const port = process.env.PORT || 5000;
app.listen(port, () => {
  logger.log('server', 'Server is listening on port ' + port);
});
