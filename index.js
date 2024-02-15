import express from 'express'
import mongoose from 'mongoose'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import cookieParser from 'cookie-parser'
import StudentModel from './models/Student.js'

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use(cors({
    origin: ["http://localhost:5173"],
    credentials:true
}))
mongoose.connect('mongodb://127.0.0.1:27017/school')

app.post('/register',(req,res) =>{
    const {name,email,password} = req.body;

    // hello remeber watch video on 19:39 min
    StudentModel.create({name,email,password})          
    .then(user => res.json(user))
    .catch(err => res.json(err))
})

app.post('/login', (req, res) =>{
    const {email, password} = req.body;
    StudentModel.findOne({email})
    .then(user =>{
        if(user ){
         if(user.password === password){
            const accessToken = jwt.sign({user}, 
                "jwt-access-token-secret-key",{expiresIn:"1m"})
            const refreshToken = jwt.sign({email:email}, 
                "jwt-refresh-token-secret-key",{expiresIn:"5m"})

            res.cookie('accessToken',accessToken ,{maxAge: 60000,httpOnly:true, secure:true})

            res.cookie('refreshToken',refreshToken, 
            {maxAge: 300000,httpOnly:true, secure:true, sameSite:'strict'})
           return res.json({Login:true})
         }
        }else{
            res.json({Login: false, Message:"no record"})
        }
    }).catch(err => res.json(err))
})
const varifyUser = (req,res,next) => {
    const accessToken = req.cookies.accessToken;
    if(!accessToken){
        if(renewToken(req, res)){
            next()
        }

    }else{
        jwt.verify(accessToken, 'jwt-access-token-secret-key',(err, decoded)=>{
            if(err){
                return res.json({valid: false, Message: "invalid Token"})
            }else{
                req.email=decoded.email;
                next()
            }
        })
    }
}

const renewToken = (req, res) =>{
    const refreshToken = req.cookies.refreshToken;
    let exist = false;
    if(!refreshToken){
        return res.json({valid:false, Message:"No refresh token"})
    }else{
        jwt.verify(refreshToken, 'jwt-refresh-token-secret-key',(err, decoded)=>{
            if(err){
                return res.json({valid: false, Message: "invalid Refresh Token"})
            }else{
                const accessToken = jwt.sign({email:decoded.email}, 
                    "jwt-access-token-secret-key",{expiresIn:"1m"})
                    res.cookie('accessToken',accessToken, {maxAge: 60000,httpOnly:true, secure:true})
                    exist = true;
            }
        })
    }
    return exist;
}

app.get('/dashboard',varifyUser,(req,res)=>{
    return res.json({valid: true, message: "authorised"})
})

app.listen(3001, () =>{
    console.log("Serve is Running")
})