
const express =  require('express')
const bodyParser= require('body-parser')
const ejs = require('ejs')
const mongoose = require('mongoose')
const encrypt = require('mongoose-encryption')



const app = express();

app.use(express.static('public'))

app.set('view engine', 'ejs')

app.use(bodyParser.urlencoded({extended:true}))

mongoose.connect('mongodb://127.0.0.1:27017/userDB').then(()=>{
    console.log("Database Connected"); 
}).catch(err=> console.log(err))


const userSchema = new mongoose.Schema({
    email : String,
    password: String
})

const secretKey = "ThisistheSecret!"
userSchema.plugin(encrypt , {secret: secretKey , encryptedFields : ['password']})

const User = new mongoose.model('User' , userSchema)
app.get("/" , (req,res)=>{
    res.render('home')
})

app.get("/login" , (req, res)=>{
    res.render('login')
})

app.get("/register" , (req, res)=>{
    res.render("register")
})

app.post("/register" , function(req,res){
    
    const newUser = new User({
        email: req.body.username , 
        password : req.body.password 
    })

    newUser.save().then((e)=>{
        console.log("New User added");
        res.render("secrets")
    }).catch(err=>console.log(err))
})

app.post("/login" , (req,res)=>{
    User.findOne({email: req.body.username}).then((foundUser)=>{
        if(foundUser.password === req.body.password){
            res.render("secrets")
        }
        else{
            console.log("wrong password");
            
        }
    })
})
app.listen(3000 , ()=>{
    console.log("Server started Listening on port 3000");
})