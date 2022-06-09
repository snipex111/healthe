const mongoose = require('mongoose');
const { Schema } = mongoose;

const roomsSchema = new Schema({
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
    room_name: String,
    chat_history: []
});


module.exports = mongoose.model('Room', roomsSchema);