const mongoose = require('mongoose');
const { Schema } = mongoose;

const DoctorSchema = new Schema({
    specialty: {
        type: Schema.Types.ObjectId,
        ref: 'Specialty'
    },
    fee: {
        type: Number,
        required: true
    },
    user:
    {
        type: Schema.Types.ObjectId,
        ref: 'User'
    }

});


module.exports = mongoose.model('Doctor', DoctorSchema);