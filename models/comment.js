let mongoose = require('mongoose');

// Comment Schema
let commentSchema = mongoose.Schema({
  author:{
    type: String,
    required: true
  },
  body:{
    type: String,
    required: true
  }
});

let Comment = module.exports = mongoose.model('Comment', commentSchema);
