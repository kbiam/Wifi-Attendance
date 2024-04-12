const mongoose = require('mongoose');

const sessionschema = new mongoose.Schema({
  SessionID:{
    type:String,
    unique:true
  },
  FacultyID:{
    type:String,
    ref:'faculty'
  },
  AttendanceRollNo:{
    type:[String],
    default:[]
  },
  SessionOpen:{
    type:Boolean,
    default:true
  }
})

module.exports = mongoose.model('session', sessionschema);
