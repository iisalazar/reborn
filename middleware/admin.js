const User = require('../models/User');

module.exports = async (req, res, next) => {
    const user = await User.findById(req.user.id);
    if(!user){
        return res.status(400).json({ msg: "Access denied! Please login first. "});
    }
    if(!user.isAdmin){
        return res.status(403).json({ msg: "Permission denied! Only admin accounts are allowed" });
    }
    
    next();
}