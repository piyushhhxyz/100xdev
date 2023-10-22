const express = require('express');
const app = express();

app.use(express.json());

const ADMINS = [] ;
let USERS = [] ;
let COURSES = [] ;


const userAuthentication = (req,res,next) => {
  const { username, password } = req.headers;
  const user = USERS.find(u => u.username===username && u.password===password)
  if(user) {
    req.user = user ;
    next()
  }
  res.status(403).json({ message: 'User authentication failed' });
}
const adminAuth = (req,res,next) => {
  const {userName, password} = req.headers ;
  const admin = ADMINS.find(u => u.userName===userName && u.password===password) ;
  if(!admin) res.status(403).json({ message: 'Admin Auth failed' });
  else next()

}

app.post("/admin/signup", (req,res) => {
  const { userName, password } = req.body ;
  if(ADMINS.find(obj => obj.userName === userName)) return res.status(401).send("Admin Already Exists");
  ADMINS.push({userName, password}) ;
  return res.status(401).send("Admin Already Exists"); 
})

app.post("/login/login",adminAuth, (req,res) => {
  res.status(201).json({ message: 'Admin Logged In' });
})

app.post('/admin/courses', adminAuthentication, (req, res) => {
  const course = req.body;

  course.id = Date.now(); // use timestamp as course ID
  COURSES.push(course);
  res.json({ message: 'Course created.', courseId: course.id });
});

app.get("/admin/courses",adminAuth, (req,res) => {
 res.json({courses: COURSES})
})

app.put("/admin/courses/:courseId",adminAuth, (req,res) => {
    const courseId = parseInt(req.params.courseId);
    const course = COURSES.find(c => c.courseId===courseId)
    if(course) {
      Object.assign(course, req.body);
      res.json({ message: 'Course updated successfully' });
    }
    res.status(404).json({ message: 'Course not found' })
})


//USERS.
app.post('/users/signup', (req, res) => {

  const user = {
    username: req.body.username,
    password: req.body.password,
    purchasedCourses: []
  }
  USERS.push(user)
  return res.json({user})
});

app.post('/users/login',userAuthentication, (req, res) => {
  res.json({user:req.user})
});

app.get('/users/courses',userAuthentication, (req, res) => { // logic to list all courses
  const filteredCourses = COURSES.filter(c => c.published)
  res.json({filteredCourses})
});

app.post('/users/courses/:courseId',userAuthentication, (req, res) => {// logic to purchase a course
  const courseId = parseInt(req.params.courseId) ;
  const course = COURSES.find(c => c.id===courseId && c.published)

  if(!course) return res.json({ message: 'Course not found or not available' });
  req.user.purchasedCourses.push(courseId) ;
  res.json({ message: 'Course purchased successfully' });
});

app.get('/users/purchasedCourses',userAuthentication, (req, res) => { // logic to view purchased courses
  // const purchasedCourses = COURSES.filter(c => req.user.purchasedCourses.includes(c.id));
  const purchasedCoursesId = req.user.purchasedCourses ;
  const purchasedCourses = COURSES.filter(c => purchasedCoursesId.includes(c.id) )
  res.json({ purchasedCourses });
});
