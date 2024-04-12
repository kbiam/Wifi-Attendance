var express = require('express');
var router = express.Router();
var studentmodel = require('./students');
var facultymodel = require('./faculty');
var jwt = require('jsonwebtoken');
var sessionmodel = require('./session');
const { token } = require('morgan');
const faculty = require('./faculty');

const secretKey = 'kush';

/* GET home page. */
router.get('/student/register',function(req,res){
  res.render('index');
});
router.post('/register', function(req, res, next) {
  const studentdata = new studentmodel({
    Name:req.body.Name,
    Password:req.body.Password,
    RollNo:req.body.RollNo

  })
studentdata.save()
    .then(() => {
      res.redirect('/student/login');
    })
    .catch((error) => {
      res.send('Error registering student: ' + error.message);
    });});

router.get('/student/login',function(req,res){
  res.render('login');
});
function verifyStudentToken(req, res, next) {
  const token = req.cookies.studentsessionToken;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    console.log(decoded)
    req.student = decoded;
    next();
  });
}
router.post('/login',async function(req,res){
  const studentdata = await studentmodel.findOne({
    Name:req.body.Name,
    Password:req.body.Password,
  });
  if(!studentdata){
    res.send('Invalid Username or Password')
  }else{
    const token = jwt.sign(
      { RollNo: studentdata.RollNo, Name: studentdata.Name },
      secretKey,
      { expiresIn: '1h' } // Token expiration time (adjust as needed)
    );
    res.cookie('studentsessionToken', token, { httpOnly: true });
    // res.json({token});
    res.redirect("/student/profile");
  }
  
});

router.get('/student/profile',function(req,res){
  res.render('studentprofile');
});
router.post('/markattendance',verifyStudentToken,async function(req,res){
  const sessionid = req.body.sessionidStudent;
  const findsession = await sessionmodel.findOne({SessionID:sessionid});
  
  if (!findsession.SessionOpen) {
    return res.send("Session is closed for attendance marking.");
  }
  else{
    const studentrollno = req.student.RollNo;
    // console.log(studentrollno);
    // console.log(findsession);
    if (!findsession.AttendanceRollNo.includes(studentrollno)) {
      findsession.AttendanceRollNo.push(studentrollno);
      await findsession.save();
      res.send("Marked Attendance Successfully");
    } else {
      res.send("Attendance already marked");
    }
  }
});


/////////////FACULTY SIDE//////////////////////////

router.get("/faculty/register", function(req,res){
  res.render('facultyregister');
})

router.post("/faculty/register",async function(req,res){
  const facultydata = await facultymodel({
    Name: req.body.FName,
    Password: req.body.Fpassword,
    FacultyID: req.body.Fid,
    Sessions: []
  });
  facultydata.save()
  .then(()=>{
    res.redirect('/faculty/login');
  })
  .catch((error)=>{
    res.send('Error registering faculty: ' + error.message);

  })
});
router.get("/faculty/login", function(req,res){
  res.render('facultylogin');
});
router.post("/faculty/login",async function(req,res){
  // console.log(req.body.Fid);
  const facultydata = await facultymodel.find({ FacultyID: req.body.Fid.trim(), Password: req.body.Fpassword.trim() });
  const faculty = facultydata[0];
  // console.log(faculty.FacultyID);
  if(!facultydata){
    res.send('Invalid Username or Password')
  }else{
    console.log("logged in")
    const token = jwt.sign(
      { FacultyID: faculty.FacultyID, Name: faculty.Name },
      secretKey,
      { expiresIn: '1h' } // Token expiration time (adjust as needed)
    );

    res.cookie('sessionToken', token, { httpOnly: true });
    res.redirect("createSession");

    }

});

function verifyToken(req, res, next) {
  const token = req.cookies.sessionToken;
  if (!token) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    // console.log(decoded)
    req.faculty = decoded;
    next();
  });
}

router.get("/faculty/createSession",verifyToken,async function(req,res){ 
  const facultysessions = await facultymodel
  .findOne({FacultyID:req.faculty.FacultyID})
  .populate( "Sessions" );
  console.log(facultysessions.Sessions[0].SessionID)
  res.render("facultyprofile",{facultysessions});
});
router.post("/faculty/createSession", verifyToken, async function(req, res) {
  function generateSessionId() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let sessionId = '';
    for (let i = 0; i < 4; i++) {
      sessionId += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return sessionId;
  }
  console.log(req.faculty.FacultyID);

  try {
    const sessionId =  generateSessionId();
    // Find the faculty by Faculty ID
    const facultyId = req.faculty.FacultyID;
  
    const facultydata = await facultymodel.findOne({ FacultyID: facultyId });
    // console.log(facultydata);
    if (!facultydata) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    // Generate a session ID
    const sessiondata =  new sessionmodel({
      SessionID:sessionId,
      FacultyID:facultyId,
      AttendanceRollNo: [],
      SessionOpen:true 
    })
    await sessiondata.save();

    // Update the faculty's record with the new session ID (modify this based on your data model)
 
    console.log(sessiondata._id);
    facultydata.Sessions.push(sessiondata._id);
    await facultydata.save();

    

    // Automatically close the session after 30 seconds
    // setTimeout(async () => {
    //   const updatedSession = await sessionmodel.findOneAndUpdate(
    //     { SessionID: sessionId },
    //     { sessionOpen: false }
    //   );

    //   if (!updatedSession) {
    //     console.log("Session not found for automatic closure.");
    //   } else {
    //     console.log("Session closed automatically after 30 seconds.");
    //   }
    // })
    res.redirect("/faculty/createSession");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

router.post('/stopsession',async function(req,res){
  const updatedSession = await sessionmodel.findOneAndUpdate(
        { SessionID: sessionId },
        { SessionOpen: false }
      );
})
module.exports = router;
