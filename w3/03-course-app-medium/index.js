const express = require('express');
const fs = require("fs")
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());

let ADMINS = [] ;
let USERS = [] ;
let COURSES = [] ;

// Read data from file, or initialize to empty array if file does not exist
try {
  ADMINS = JSON.parse(fs.readFileSync('admins.json', 'utf8'));
  USERS = JSON.parse(fs.readFileSync('users.json', 'utf8'));
  COURSES = JSON.parse(fs.readFileSync('courses.json', 'utf8'));
} catch {
  ADMINS = [];
  USERS = [];
  COURSES = [];
}

const secretKey = "superS3cr3t1";
const generateJwt = (user) => {
  const payload = {username:user.username, password:user.password} ;
  return jwt.sign(payload, secretkey, {expiresIn: '1h'}) ;
}

const authenticateJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    jwt.verify(token, SECRET, (err, user) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  } 
  else res.sendStatus(401);
};

app.post('/admin/signup', (req, res) => {
  const admin = req.body ;
  const existing = ADMINS.find(a => a.username===admin.username && a.password===admin.password)
  if(existing) res.json({msg:"Already Esists"})
  else {
    ADMINS.push(admin) ;
    fs.writeFileSync('admins.json', JSON.stringify(ADMINS));
    const token = generateJwt(admin)
    res.json({msg:"Admin Creaated.", token:token})
  }
});

app.post('/admin/login', (req, res) => {
  const admin = req.body ;
  const verified = ADMINS.find(a => a.username===admin.username && a.password===admin.password)
  if(verified) {
    const token = generateJwt(admin) ;
    res.json({msg:"LoggedAdmin",token}) 
  }
  else res.json("nOt Logging In")
});

app.post('/admin/courses', authenticateJwt, (req, res) => { //create a course
  const course = req.body ; 
  const cid = COURSES.length +1 ;
  COURSES.push(course) ;
  fs.writeFileSync('courses.json', JSON.stringify(COURSES));
  res.json({ message: 'Course created successfully', courseId:cid });

});

app.put('/admin/courses/:courseId', (req, res) => { //edit a course
  const prevCourse = COURSES.find(c => c.id === parseInt(req.params.courseId));
  const newCourse = req.body ;
  if (prevCourse) {
    Object.assign(prevCourse, newCourse);
    fs.writeFileSync('courses.json', JSON.stringify(COURSES));
    res.json({ message: 'Course updated successfully' });
  } 
  else res.status(404).json({ message: 'Course not found' });
});

app.get('/admin/courses', authenticateJwt, (req, res) => {// logic to get all courses
  res.json({COURSES}) ;
});

// User routes
app.post('/users/signup', (req, res) => {
  const user = req.body;
  const existingUser = USERS.find(u => u.username === user.username);
  if (existingUser) {
    res.status(403).json({ message: 'User already exists' });
  } else {
    USERS.push(user);
    fs.writeFileSync('users.json', JSON.stringify(USERS));
    const token = generateJwt(user);
    res.json({ message: 'User created successfully', token });
  }
});

app.post('/users/login', (req, res) => {
  const { username, password } = req.headers;
  const user = USERS.find(u => u.username === username && u.password === password);
  if (user) {
    const token = jwt.sign({ username, role: 'user' }, SECRET, { expiresIn: '1h' });
    res.json({ message: 'Logged in successfully', token });
  } else {
    res.status(403).json({ message: 'Invalid username or password' });
  }
});

app.get('/users/courses', authenticateJwt, (req, res) => {
  res.json({ courses: COURSES });
});

app.post('/users/courses/:courseId', authenticateJwt, (req, res) => {
  const course = COURSES.find(c => c.id === parseInt(req.params.courseId));
  if (course) {
    const user = USERS.find(u => u.username === req.user.username);
    if (user) {
      if (!user.purchasedCourses) {
        user.purchasedCourses = [];
      }
      user.purchasedCourses.push(course);
      fs.writeFileSync('users.json', JSON.stringify(USERS));
      res.json({ message: 'Course purchased successfully' });
    } else {
      res.status(403).json({ message: 'User not found' });
    }
  } else {
    res.status(404).json({ message: 'Course not found' });
  }
});

app.get('/users/purchasedCourses', authenticateJwt, (req, res) => {
  const user = USERS.find(u => u.username === req.user.username);
  if (user) {
    res.json({ purchasedCourses: user.purchasedCourses || [] });
  } else {
    res.status(403).json({ message: 'User not found' });
  }
});