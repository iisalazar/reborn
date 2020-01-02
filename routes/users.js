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
    res.json({
        msg: "This is the users endpoint. Register here"
    })
})

router.get('/all', [auth, admin], async (req, res) => {
    try {
        const users = await User.find({ isAdmin: false }).select(['-password', '-dateCreated', ]);
        /*
        const page = req.query.page || 1;
        const limit = req.query.limit || 10;
        const options = {
            page,
            limit,
            select: ['-password', '-dateCreated', ]
        }
        
        const users = await User.paginate({ isAdmin: false}, options);
        */
        // return res.json(users.docs);
        return res.json(users);
    } catch(err){
        console.error(err.message);
        return res.status(500).json({ msg: "Server error" });
    }
})
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id)
                            .select(['-password', '-isAdmin', '-lastLogin']);
        return res.json( user );
    } catch(err){
        console.error(err.message);
        return res.status(500).send({ msg: "Server error" });
    }
})

router.post('/login',
    [
        check("username", "Username should not be blank").not().isEmpty(),
        check("password", "Password should not be blank").not().isEmpty()
    ],
    async (req, res) => {
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
        user.lastLogin = new Date();
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
            username
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


router.post('/verify/:id', [auth, admin], async (req, res) => {
    console.log(req.params.id);
    const user = await User.findById(req.params.id);
    if(!user){
        return res.status(400).json({ msg: "User not found "});
    }
    if(user.verified){
        return res.status(400).json({ msg: `User ${user.username} is already verified`});
    }
    user.verified = true;
    await user.save();
    return res.json({ msg: `User ${user.username} verified!`});
})

router.post('/unverify/:id', [auth, admin], async (req, res) => {
    console.log(req.params.id);
    const user = await User.findById(req.params.id);
    if(!user){
        return res.status(400).json({ msg: "User not found "});
    }
    if(!user.verified){
        return res.status(400).json({ msg: `User ${user.username} is not verified`});
    }
    user.verified = false;
    await user.save();
    return res.json({ msg: `User ${user.username} unverified!`});
})

// get user's personal  information
router.get('/:id', auth, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select(['-password', '-dateCreated', '-isAdmin' ]);
        if(!user){
            return res.status(400).json({ msg: "User not found" });
        }
        console.log(user)
        return res.json(user);
    } catch(err){
        console.error(err.message);
        res.status(500).json({ msg: "Server error." });
    }
});


router.put('/:id', auth, async (req, res) => {
    const { firstName, lastName, username, password } = req.body;
    let userFields = {};
    if(firstname) userFields.firstName = firstName;
    if(lastName) userFields.lastName = lastName;
    if(username) userFields.username = username;
    if(password) userFields.password = password;
    try {
        let user = await User.find(req.params.id);
        if(!user){
            return res.status(400).json({ msg: `User ${username} not found`});
        }
        if(user._id.toString() !== req.user.id){
            return res.status(403).json({ msg: "Not authorized" });
        }
        user = await User.findByIdAndUpdate(
            req.params.id,
            { $set: userFields },
            { new: true }
        );
        return res.json( user );
    } catch(err){
        console.error(err.message);
        return res.status(500).json({ msg: "Server error! Please contact admin" });
    }
})

router.delete('/:id', auth, async (req, res) => {
    try {
        let user = await User.findById(req.params.id);
        if(!user) return res.status(404).json({ msg: "User not found" });
        console.log(req.user)
        if ( (user.id.toString() === req.user.id) || req.user.isAdmin ){
            console.log("Deleting...")
            await User.findByIdAndRemove(req.params.id);
            return res.json({ msg: "User deleted!" });
        }
        return res.status(403).json({ msg: "Not authorized" });
    } catch(err){
        console.error(err.message);
        res.status(500).json({ msg: "Server error!" });
    }
})
module.exports = router