const mongoose = require('mongoose');
const { type } = require('os');
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
    fullname: {
        type: String,
        required: true
    },
    qualification: {
        type: String
    },
    user:
    {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    myappointments: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Appointment'
        }
    ]

});


module.exports = mongoose.model('Doctor', DoctorSchema);