const express = require("express")
const jwt = require("jsonwebtoken") 

const app = express() ;
app.use(express.json());

let ADMINS = [];
let USERS = [];
let COURSES = [];

const secretKey = "superS3cr3t1"
const generateJwt = (user) => {
  const payload = { username: user.username }  // Payload (data to be stored in the token)
  const token = jwt.sign(payload, secretKey, { expiresIn:'1h' }) ;
  return token ;
}

const authenticateJwt = (req,res,next) => {
  const authHeader = req.headers.authorization //Headers: { 'Authorization': 'Bearer jwt_token_here' } 
  if(authHeader) {
    const token = authHeader.split(' ')[1] ; 

    jwt.verify(token, secretKey, (err,user)=> {
      if (err) return res.sendStatus(403);

      req.user = user;
      next();
    });
  }
  else res.json('TOken not found in Headers.')
}

app.post("/admin/signup", (req,res) => {
  const admin = req.body ;
  const existingAdmin = ADMINS.find(a => a.username===admin.username) 
  if(existingAdmin) return res.json('admin alreadt exists.') 
  const token = generateJwt(admin) ;
  res.json({ message: 'admin created successfully.', token}) ;
})

app.post("/admin/login", (req,res) => {
  const { username, password } = req.headers;
  const admin = ADMINS.find(a => a.username===username && a.password===password) 

  if(admin) {
    const token = generateJwt(admin) ;
    res.json({ message: 'admin LoggedIN successfully.', token}) ;
  }
  else res.status(403).json({ message: 'Admin Auth failed' });
})

app.post('/admin/courses',authenticateJwt, (req, res) => {//create a course
  const course = req.body ;
  const courseId = COURSES.length +1 ;
  COURSES.push(courseId) ;
  res.json({msg:`${courseId}: ${course} created.`})  
});

app.put('/admin/courses/:courseId',authenticateJwt, (req, res) => {//edit a course
  const courseId = parseInt(req.params.courseId)
  const courseIndex = COURSES.findIndex(c => c.id===courseId)

  if(CourseInd>-1) {
    const updatedCourse = {
      ...COURSES[courseIndex],
      ...req.body
    }
    COURSES[courseIndex] = updatedCourse ;
    res.json('Course Updated.')
  }
  else res.json('course not found.')
});

app.get('/admin/courses',authenticateJwt, (req, res) => { //get all courses
  res.json({ courses: COURSES });
});


// USER Routes
app.post('/users/signup', (req, res) => {
  const user = req.body;
  const existingUser = USERS.find(u => u.username === user.username);
  if (!existingUser) {
    USERS.push(user);
    const token = generateJwt(user);
    res.json({ message: 'User created successfully', token });
  }
  else res.status(403).json({ message: 'User already exists' }); 
});

app.post('/users/login', (req, res) => {
  const { username, password } = req.headers;
  const user = USERS.find(u => u.username === username && u.password === password);
  if (user) {
    const token = generateJwt(user);
    res.json({ message: 'Logged in successfully', token });
  } 
  else res.status(403).json({ message: 'User authentication failed' });
});

app.get('/users/courses', (req, res) => { //list all courses
  res.json({ courses: COURSES });
});

app.post('/users/courses/:courseId', (req, res) => { //purchase a course
  const courseId = parseInt(req.params.courseId)
  const course = COURSES.find(c => c.id === courseId) 
  const user = USERS.find(u => u.username === req.user.username) 
  if(course) {
    if(!user.purchasedCourses) user.purchasedCourses = []
    else user.purchasedCourses.push(courseId) ;
  }
  else res.json('No Course Found.')
});

app.get('/users/purchasedCourses', (req, res) => { //view purchased courses
  const user = USERS.find(u => u.username === req.user.username)
  if(user && user.purchasedCourses) res.json({ purchasedCourses: user.purchasedCourses });
  else res.status(404).json({ message: 'User hasNO courses purchased' });
});