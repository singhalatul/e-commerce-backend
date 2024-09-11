import {User} from '../models/user.model.js'
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyJWT } from './auth.middleware.js';

export const verifyAdmin = asyncHandler(async(req,res,next)=>{
    const user=req.user;

    if(user && user.role=='admin'){
        return next();
    }

    return res.status(400).json(new ApiError(403,"access denied admins only"))
})