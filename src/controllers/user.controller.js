import {asyncHandler} from '../utils/asyncHandler.js';
import {ApiError} from '../utils/ApiError.js';
import {User} from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import {ApiResponse} from '../utils/ApiResponse.js';
import jwt from 'jsonwebtoken';
import { sendEmail } from '../utils/sendEmail.js';
import mongoose from 'mongoose';

const  generateAccessAndRefreshToken = async(userId)=>{
    try{
        const user = await User.findOne(userId);
        
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        console.log(accessToken)
        console.log(refreshToken)

        user.refreshToken = refreshToken;

        await user.save({validateBeforeSave:false})

        return {refreshToken,accessToken}
    }
    catch(err){
        throw new ApiError(500,"something went wrong");
    }

}

const getResetToken = async(userId)=>{
    try{
        const user=await User.findById(userId)
        const token= user.getResetPasswordToken()
        console.log("token : ",token)

        await user.save();
        return token;
    }catch(err){

    }
    
}

const registerUser = asyncHandler(async(req,res)=>{
    const{username,name,email,password,age} = req.body;

    if([username,name,email,password,age].some
    ((field)=>field?.trim()==null)){
        throw new ApiError(400,"All fileds are required");
    }


    try {
        const existedUser = await User.findOne({
            $or:[{username},{email}]
        })
    
        if(existedUser){
            throw new ApiError(409, "user already exist")
        }
    
        const image = req.file?.path
    
        const profile = await uploadOnCloudinary(image)
    
        if(!profile){
            throw new ApiError(500,'internal server error')
        }
    
        if(!profile){
            throw new ApiError(404,"image not found");
        }
    
        const user = await User.create({
            name,
            email,
            age,
            password,
            username:username.toLowerCase(),
            profilePic:{
                publicId:profile.public_id,
                url:profile.url
            }
        })
    
        await user.save({validateBeforeSave:false});
    
        return res.status(200).json(
            new ApiResponse(200,
                user,
                "user registered successfully"
            )
        )
    } catch (error) {
        throw new ApiError(500,error.message)
    }
})

const loginUser = asyncHandler(async(req,res)=>{

    const {email,username,password}= req.body

    if(!username && !email){
        throw new ApiError(400,"all fields are required");
    }

    const user = await User.findOne({
        $or: [{username}, {email}]
    })

    if (!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const {refreshToken,accessToken} = await generateAccessAndRefreshToken(user._id)

    const loggedIn = await User.findById(user._id).select("-password -refreshToken")
    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,
            {
                user:loggedIn, refreshToken, accessToken
            },
            "user logged in successfully"
        )
    )

})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
            refreshToken:1
            }
        },
        {
            new:true
        }
    )

    const options={
        httpOnly:true,
        secure:true
    }

    res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200,{},"User logout successfully")
    )

})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingToken = req.cookies?.refreshToken || req.body.refreshToken

    if(!incomingToken){
        throw new ApiError(401,"unauthorized request");
    }

    const verifiedToken = jwt.verify(incomingToken,process.env.REFRESH_TOKEN_SECRET)
    const user = await User.findById(verifiedToken?._id).select("password")

    if(!user){
        throw new ApiError(401,"Invlaid request")
    }

    if(user?.refreshToken != incomingToken){
        throw new ApiError(401,"refresh Token expired or used")
    }

    const options ={
        httpOnly:true,
        secure:true
    } 

    const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id)

    return res.status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(200,
                {accessToken,refreshToken:newRefreshToken},
                "token generated successfully"
            )
        )
})

const changeUserPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword,confirmPassword}= req.body

    if(!oldPassword && !newPassword && !confirmPassword){
        throw new ApiError(400,"All fileds are required");
    }

    if(newPassword != confirmPassword){
        throw new ApiError(410,"password not matched")
    }

    const user = await User.findById(req.user._id);

    const verifyPassword = user.isPasswordCorrect(oldPassword);

    if(!verifyPassword){
        throw new ApiError(401,"password does not match")
    }

    user.password=newPassword;
    await user.save({validateBeforeSave:false})

    return res.status(200)
   .json(
        new ApiResponse(200,{},"password change successfully")
   )
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    const user = req.user
    return res.status(200).json(
        new ApiResponse(200,
        {
            user
        },
        "getting user successfully"
    ))
})

const getAllUsers = asyncHandler(async(req,res)=>{
    const users = await User.find().lean();

    if(!users){
        res.status(200).json(
            new ApiResponse(200,{},"not user available")
        )
    }
    
    else{
        return res.status(200).json(
            new ApiResponse(200,
                users.map((user)=>user),
                "getting all users successfuly"
            )
        )
    }
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName} = req.body;

    if(!fullName){
        throw new ApiError(400,"All fields are required")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set :{name:fullName
            }
        },
        {new:true}
    ).select("-password")

    return res.status(200).json(
        new ApiResponse(200,
        {
            user
        },
        "update name successfully"
    ))
})

const updateUserProfilePic = asyncHandler(async(req,res)=>{

    const imageLocalPath = req.file?.path
    
    if(!imageLocalPath){
        throw new ApiError("401","Avatar file is required")
    }
    
    const pic = await uploadOnCloudinary(imageLocalPath);

    if(!pic.url){
        throw new ApiError(400,"Error while uploading avatar on cloudinary")
    }
    
    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set :{
                profilePic:{
                    url:pic.url,
                    publicId:pic.public_id
                }
            }
        },
        {
            new:true
        }
    ).select("-password");

    if(!user){
        throw new ApiError(401,"invalid user")
    }
    user.save({validateBeforeSave:false})

    return res.status(200).json(
        new ApiResponse(200,
            {user},
            "profile update successfully"
        )
    )
})

const forgetPassword = asyncHandler(async(req,res)=>{
    const {email} = req.body;
    if(!email){
        throw new ApiError(400,"required feild")
    }
    const user = await User.findOne({email}).lean().select("-password")

    if(!user){
        throw new ApiError(404,"user or email nor found")
    }

    const resetToken = await getResetToken(user._id);
    const resetPasswordUrl = `${req.protocol}://localHost:5000/password/reset?token=${resetToken}`
    const message = `your password reset token is :- \n\n ${resetPasswordUrl} \n\n this is valid for 15 minutes only`

    try{
        await sendEmail({
            email,
            subject:"reset password",
            message
        })

        return res.status(200).json(
            new ApiResponse(200,
                {},
                "email send successfully"
            )
        )
    }
    catch(err){
        throw new ApiError(500,'nodemailer error')
    }
})

const resetPassword = asyncHandler(async(req,res)=>{
    const {token} = req.params;
    const {newPassword,confirmPassword} = req.body;
    if(newPassword!=confirmPassword){
        throw new ApiError(401,"password not matched");
    }
        const { createHmac } = await import('node:crypto');
        const hashToken =createHmac('sha256',token).update(token).digest('hex');
        console.log(hashToken,Date.now());
        
        const user= await User.findOne({
            resetPasswordToken:hashToken,
            resetPasswordExpiry:{$gt:Date.now()}
        })
        if(!user){
            throw new ApiError("invalid token or expired Token")
        }
        
        await User.findByIdAndUpdate({_id:user._id},{
            $set:{
                resetPasswordToken:null,
                resetPasswordExpiry:null
            }
        })
        user.password=newPassword;
        await user.save({validateBeforeSave:false})
    return res.status(200).json(
        new ApiResponse(200,
            {},
            "password reset successfully"
        )
    )
})

const deleteProfile = asyncHandler(async(req,res)=>{
    const {user} = req.params;
    
    if(!user){
        throw new ApiResponse(404,"user not found");
    }

    await User.findByIdAndDelete(user._id);

    return res.status(200).json(
        new ApiResponse(200,{},"user profile delete successfully")
    )
})



export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeUserPassword,
    getCurrentUser,
    getAllUsers,
    updateAccountDetails,
    updateUserProfilePic,
    forgetPassword,
    resetPassword,
    deleteProfile,
}