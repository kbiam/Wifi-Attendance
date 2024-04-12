const mongoose = require('mongoose');

const facultyschema = new mongoose.Schema({
  Name:{
    type:String,
    required:true
  },
  Password:{
    type:String
  },
  FacultyID:{
    type:String,
    unique:true
  },
  Sessions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'session',
    },
  ],
})

module.exports = mongoose.model('faculty', facultyschema);
