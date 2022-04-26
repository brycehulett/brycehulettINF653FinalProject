const express = require('express');
const router = express.Router();
const path = require('path');
//const {statesArray} = require('../config/statesArray');

router.get('/states', (req, res) => {
    console.log("hdkjflskj");
    return res.json(statesArray);
});

module.exports = router;