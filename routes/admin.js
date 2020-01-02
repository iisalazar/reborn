const express = require('express');
const bcrypt = require('bcryptjs');
const { check, validationResult } = require("express-validator");
const jwt = require('jsonwebtoken');
const config = require('config');

const router = express.Router();
const User = require('../models/User');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.get('/', (req, res) => {
    res.json({ msg : "This is the admin route." });
});

router.post('/login',
    [
        check("username", "Username is required").not().isEmpty(),
        check("password", "Password field should not be blank").not().isEmpty()
    ],
    async (req, res) => {
        
        try {
            const errors = validationResult(req);
            if( !errors.isEmpty() ) {
                return res.status(400).json({ msg: errors.array() });
            }
            const { username, password } = req.body;
            const user = await User.findOne({ username });
            if(!user){
                return res.status(400).json({ msg: `User with username "${username}" not found`});
            }
            const isMatch = bcrypt.compare(password, user.password );
            if(!isMatch){
                return res.status(400).json({ msg: "Passwords do not match" });
            }
            if(!user.isAdmin){
                return res.status(403).json({ msg: "Only admin accounts are allowed." });
            }
            const payload = {
                user: {
                    id: user.id
                }
            }
            jwt.sign( payload, config.get('JWTsecret'),{
                    expiresIn: 3600000
                }, (err, token) => {
                    if(err) {
                        console.error(err);
                        return res.status(500).json({ msg: "Server error. Please contact admin" });
                    }
                    return res.json({ token });
            });
        } catch(err) {
            console.error(err.message);
            return res.status(400).json({ msg: "Server error" });
        }
    }
)


router.post('/register',
    [
        check("firstName", "First Name is required").not().isEmpty(),
        check("lastName", "Last Name is required").not().isEmpty(),
        check("username", "Username is required").not().isEmpty(),
        check("password", "Please enter a password w/ 6 or more characters")
            .isLength({ min: 6})
    ], 
    async (req, res) => {
        const errors = validationResult(req);
        if( !errors.isEmpty() ) {
            return res.status(400).json({ msg: errors.array() });
        }
        const { firstName, lastName, username, password } = req.body;
        let user = await User.findOne({ username });
        if(user){
            return res.status(400).json({ msg: `The username "${username}" is already taken.`});
        }
        user = new User({
            firstName,
            lastName,
            username,
            isAdmin: true,
            verified: true
        });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();
        const payload = {
            user: {
                id: user.id
            }
        }
        jwt.sign( payload, config.get('JWTsecret'),{
                expiresIn: 3600000
            }, (err, token) => {
                if(err) {
                    console.error(err);
                    return res.status(500).json({ msg: "Server error. Please contact admin" });
                }
                return res.json({ token });
            });
    }
)


router.get('/check', [auth, admin], async (req, res) => {
    res.json({ msg : "Authenticated" });
})
module.exports = router;