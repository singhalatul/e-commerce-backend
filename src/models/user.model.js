import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';


const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        lowercase:true,
        trim:true,
        index:true
    },
    name:{
        type:String,
        required:true,
        lowercase:true,
        trim:true,
    },
    email:{
        type:String,
        required:true,
        lowercase:true,
        trim:true,
    },
    age:{
        type:Number,
        required:true,
        trim:true,
    },
    password:{
        type:String,
        required:[true,"password is required"],
        trim:true,

    },
    role:{
        type:String,
        enum:['user','admin'],
        default:"user"
    },
    profilePic:{
        publicId:{
            type:String,
            required:true
        },
        url:{
            type:String,
            required:true
        }
    },
    refreshToken:{
        type:String
    },
    resetPasswordToken:{
        type:String
    },
    resetPasswordExpiry:{
        type:Date
    }
    
},{timestamps:true})

userSchema.pre("save",async function(next){
    if(!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect = async function(password){
   return await bcrypt.compare(password,this.password); 
}

userSchema.methods.generateAccessToken =function(){
    return jwt.sign({
        email:this.email,
        _id:this._id,
        username:this.username
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
        expiresIn:process.env.ACCESS_TOKEN_EXPIRY
    }
    )
}

userSchema.methods.generateRefreshToken = function(){
    return jwt.sign({
        _id:this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
        expiresIn:process.env.REFRESH_TOKEN_EXPIRY
    }
    )
}

userSchema.methods.getResetPasswordToken= async function(){
    const { createHmac } = await import('node:crypto');
    let secret="";
    const str="1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSSTUVWXYZ"
    for(let i=1;i<=20;i++){
        const random = Math.floor(Math.random()*str.length+1)
        secret+=str[random];
    }
    this.resetPasswordToken =createHmac('sha256',secret).update(secret).digest('hex');
    this.resetPasswordExpiry = Date.now()+15*60*1000;
    return secret;
}



export const User = mongoose.model("User",userSchema);