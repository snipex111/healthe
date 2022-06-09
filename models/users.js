const mongoose = require('mongoose');
const { Schema } = mongoose;
const passportlocalmongoose = require('passport-local-mongoose');
const UserSchema = new Schema({

    email: {
        type: String,
        required: true,
        unique: true
    },
    usertype:
    {
        type: Number,
        required: true
    },
    mychats: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Room'
        }
    ]

});

UserSchema.plugin(passportlocalmongoose);
module.exports = mongoose.model('User', UserSchema);