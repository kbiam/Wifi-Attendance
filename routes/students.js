const mongoose = require('mongoose');
mongoose.connect("mongodb://127.0.0.1:27017/AttendanceApp");

const studentschema = new mongoose.Schema({
  Name:{
    type:String,
    required:true

  },
  Password:{
    type:String
  },
  RollNo:{
    type:String,
    unique:true
  },
  Branch:{
    type:String,
    required:true
  },
  Division:{
    type:String,
    required:true
  }
})

module.exports = mongoose.model('student', studentschema);
