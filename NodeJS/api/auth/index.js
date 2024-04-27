const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.send('API Home');
});

router.use('/client_credentials', require('./token/client_credentials'));
router.use('/authorization_code', require('./token/authorization_code'));

module.exports = router;