const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', { title: 'StyleSync - Living Design Systems' });
});

router.get('/dashboard/:siteId', (req, res) => {
  res.render('dashboard', { siteId: req.params.siteId });
});

module.exports = router;
