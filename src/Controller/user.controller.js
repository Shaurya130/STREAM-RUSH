import { asyncHandler } from "../utils/asyncHandle.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/userModel.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser= asyncHandler( async(req,res) => {
    const { fullName, email, username, password} = req.body; // all details taken from user except avatar and image

    const userExist=await User.findOne({
        $or: [ {username}, {email}]
    })

    const avatarLocalPath=req.files?.avatar[0]?.path
    const coverLocalPath=req.files?.coverImage[0]?.path

    //validation
    if( [fullName,email,username,password].some((field)=> field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }
    if( userExist){
        throw new ApiError(409, "User with username or email already exist")
    }
    if(!avatarLocalPath){
        throw new ApiError( 400, "Avatar is required")
    }
    if(!coverLocalPath){
        throw new ApiError( 400, "Cover Image is required")
    }

    //creation

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverLocalPath)

    const user=await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage.url,
        email,
        username: username.toLowerCase(),
        password
    })

    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json( new ApiResponse(200, createdUser,"User Registered successfully"))
})

export{
    registerUser
}