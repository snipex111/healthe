const mongoose = require('mongoose');
const { Schema } = mongoose;

const SpecialtySchema = new Schema({
    name: {
        type: String,
        required: true
    },
    image: {
        type: String
    },
    doctors: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Doctor'
        }
    ]
});


module.exports = mongoose.model('Specialty', SpecialtySchema);