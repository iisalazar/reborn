const express = require('express');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require("express-validator");
const jwt = require('jsonwebtoken');
const config = require('config');

const router = express.Router();
const User = require('../models/User');
const auth = require("../middleware/auth");

router.get('/', (req, res) => {
    res.json({
        msg: "This is the authentication endpoint"
    })
})


module.exports = router