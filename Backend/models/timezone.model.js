const mongoose = require('mongoose');

const TimeZoneSchema = new mongoose.Schema({
    name: { type: String, required: true },  
    abbreviation: { type: String, required: true },
    offset: { type: Number, required: true },
    utcOffsetString: { type: String, required: true },
    states: { type: [String], required: true }
});

module.exports = mongoose.model('TimeZone', TimeZoneSchema);