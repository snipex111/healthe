const mongoose = require('mongoose');
const { Schema } = mongoose;

const AppointmentSchema = new Schema({
    doctor: {
        type: Schema.Types.ObjectId,
        ref: 'Doctor',
        required: true
    },
    patient: {
        type: Schema.Types.ObjectId,
        ref: 'Patient',
        required: true
    },
    fee: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    symptoms: {
        type: String
    }
});


module.exports = mongoose.model('Appointment', AppointmentSchema);