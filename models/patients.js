const mongoose = require('mongoose');
const { Schema } = mongoose;

const PatientSchema = new Schema({
    fullname: {
        type: String,
        required: true
    },
    age: {
        type: Number,
        required: true
    },
    gender: {
        type: String,
        required: true
    },
    vaccinationstatus: {
        type: Number,
        required: true
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


module.exports = mongoose.model('Patient', PatientSchema);