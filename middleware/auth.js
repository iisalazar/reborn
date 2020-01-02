const jwt = require('jsonwebtoken');
const config = require('config');
const User = require('../models/User');

module.exports = async (req, res, next) => {
    const token = req.header("x-auth-token");
    if(!token){
        return res.status(401).json({ msg: "No token, access denied" });
    }
    try {
        const decoded = jwt.verify(token, config.get('JWTsecret'));
        const user = await User.findById(decoded.user.id);
        req.user = user;
        next();
    } catch(err){
        res.status(401).json({ msg: "Invalid token "});
    }
}