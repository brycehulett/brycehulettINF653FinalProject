const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const StateSchema = new Schema({
    stateCode:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    funfacts:{
        type : Array, 
        "default" : []
    }
});

var State = mongoose.model('State', StateSchema);
module.exports = State;