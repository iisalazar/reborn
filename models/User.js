const mongoose = require('mongoose');

const mongoosePaginate = require('mongoose-paginate-v2');

const UserSchema = mongoose.Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true,
        
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    dateCreated: {
        type: Date,
        default: Date.now
    },
    lastLogin: {
        type: Date,
        default: Date.now
    },
    password: {
        type: String,
        required: true
    }
    /*
    isAdmin: {
        type: Boolean,
        default: false
    },
    verified: {
        type: Boolean,
        default: false
    }
    */
})

UserSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('user', UserSchema);