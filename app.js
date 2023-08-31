require('dotenv').config()
const express =  require('express')
const bodyParser= require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
// const encrypt = require('mongoose-encryption')
// const md5 =  require('md5')
// const bcrypt = require('bcrypt');
// const saltRounds = 10;
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')
// const ObjectID = require('mongodb').ObjectID;
// async function genHash(simplaPassword){

//     const hash = await bcrypt.hash(simplaPassword , saltRounds)
//     return hash
// }

const app = express();

app.use(express.static('public'))

app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({extended:true}))

app.use(session({
    secret : "Our Little Secret" , 
    resave: false,
    saveUninitialized : false
}))


app.use(passport.initialize())
app.use(passport.session())

mongoose.connect('mongodb://127.0.0.1:27017/userDB').then(()=>{
    console.log("Database Connected"); 
}).catch(err=> console.log(err))


const userSchema = new mongoose.Schema({
    email : String,
    password: String,
    googleId: String,
    secret : String,
    
})

userSchema.plugin(passportLocalMongoose );
// userSchema.plugin(encrypt , {secret: process.env.SECRET , encryptedFields : ['password']})
userSchema.plugin(findOrCreate)


const User = new mongoose.model('User' , userSchema)


passport.use(User.createStrategy())

passport.serializeUser(function(user, cb) {
  process.nextTick(function() {
    console.log("user details");
    console.log(user);
    return cb(null, user.id);
  });
});

passport.deserializeUser(function(user, cb) {
  process.nextTick(function() {
    return cb(null, user);
  });
});



passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
    
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) { 
      cb(err, user) 
    });
  }
));




app.get("/" , (req,res)=>{
    res.render('home')
})

app.get('/auth/google', passport.authenticate('google', { scope: ['profile'] , prompt: 'select_account' , includeGrantedScopes: true }))



app.get("/secrets" , (req,res)=>{
    console.log("Auth : " , req.isAuthenticated());
    
    User.find({"secret" : {$ne: null}}).then(foundUsers=>{
      if(foundUsers){
        res.render("secrets" , {usersWithSecret: foundUsers})
      }
    })
})



app.get('/auth/google/secrets', 
passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    console.log("\n\n\n\n Hitting Here \n\n\n");
    res.redirect("/secrets");
  });

app.get("/login" , (req, res)=>{
    res.render('login')
})

app.get("/register" , (req, res)=>{
    res.render("register")
})

app.post("/register" ,  function (req,res){
    
    User.register({username: req.body.username} ,req.body.password , function(err , user){
        if(err){
            console.log(err);
            res.redirect("/register")
        }
        else{
            passport.authenticate("local")(req, res , function(){
                res.redirect("/secrets")
            })
        }
    })    
})

app.post("/login",function(req,res){

    const user=new User({
      username:req.body.username,
      password:req.body.password
    });
    // passport js doc
  req.login(user,function(err){
    if(err){
      console.log(err);
    }else{
      passport.authenticate("local")(req,res,function(){
        res.redirect("/secrets")
      });
    }
  });
})


app.get("/logout" , function(req,res,next){
    req.logout(function(err){
        if(err){
            return next(err);
        }
        res.redirect("/")
    })    
})

app.get("/submit" , function(req , res){
  if(req.isAuthenticated()){
    res.render("submit")
  }
  else{
    res.redirect("/login")
  }
})

app.post("/submit" , function(req, res){
  if(!req.isAuthenticated()) res.redirect('/login')
  const submittedSecret = req.body.secret
  const mid = req.user
  console.log(typeof mid + " " + mid);
  User.findById(mid).then(found=>{
    console.log("found " , found);
    found.secret = submittedSecret;
    found.save().then(()=>{
      res.redirect("/secrets")
    })
    
  })
    
})

app.listen(3000 , ()=>{
    console.log("Server started Listening on port 3000");
})