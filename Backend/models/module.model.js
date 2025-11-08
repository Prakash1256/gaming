const mongoose = require("mongoose");

const moduleSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    subModules: [
        { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'SubModule' 
        }
    ],
});

module.exports = mongoose.model('Module', moduleSchema);