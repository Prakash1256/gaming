// const mongoose = require('mongoose');

// const TableSchema = new mongoose.Schema({
//     venueId: {type: mongoose.Schema.Types.ObjectId, required:true},
//     label: { type: String, required: true },  
//     size: { type: Number, required: true },   
//     make: { type: String, required: true }, 
//     name:{type:String, required: true},  
//     streamingUrl: { type: String, required: false }
// }, { timestamps: true });

// module.exports = mongoose.model('Table', TableSchema);


const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
    venueId: {type: mongoose.Schema.Types.ObjectId, required:true},
    // label: { type: String, required: true },  
    label: { type: String, required: false, default: "" },
    size: { type: String, required: true },   
    make: { type: String, required: true }, 
    name:{type:String, required: true},  
    streamingUrl: { type: String, required: false }
}, { timestamps: true });

module.exports = mongoose.model('Table', TableSchema);