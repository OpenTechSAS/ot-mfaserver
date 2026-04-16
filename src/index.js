const express = require('express');
const helmet = require('helmet');
const { apiKeyAuth } = require('./lib/auth');

const app = express();
app.use(helmet());
app.use(express.json());
app.set('trust proxy', 1);

app.use(require('./routes/health'));

app.use(apiKeyAuth);
app.use(require('./routes/enrol'));
app.use(require('./routes/confirm'));
app.use(require('./routes/validate'));
app.use(require('./routes/delete'));

const PORT = parseInt(process.env.PORT || '8090', 10);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`mfaserver listening on :${PORT}`);
});
