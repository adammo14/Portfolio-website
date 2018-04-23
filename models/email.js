let mongoose = require('mongoose');

// Email Schema
let emailSchema = mongoose.Schema({
  name:{
    type: String,
    required: true
  },
  email:{
    type: String,
    required: true
  },
  tel:{
    type: String,
  },
  website:{
    type: String,
  },
  message:{
    type: String,
    required: true
  }
});

let Email = module.exports = mongoose.model('Email', emailSchema);
