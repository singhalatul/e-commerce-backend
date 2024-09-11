import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret:process.env.CLOUDINARY_API_SECRET// Click 'View API Keys' above to copy your API secret
});

const deleteFromCloudinary = async (publicId, type = 'upload', resource_type) => {
    try{
       await cloudinary.uploader.destroy(publicId.trim(),{resource_type:'video'||'image'},(err,result)=>{
        if(err){
            console.log(err)
        }else{
            console.log(result)
        }
       })
    }
    catch(err){
        console.log(err)
    }
}


const uploadOnCloudinary = async (localFilePath)=>{
    try{
        if(!localFilePath) return null
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type:"auto"
        })
        //file has been uploaded successfully
        // console.log("file has been uploaded successfully",response.url)
        fs.unlinkSync(localFilePath)
        return response
    }catch(err){
        fs.unlinkSync(localFilePath) // remove local saved temporary file as the upload operation got failed
        return null;
    }
}

export {uploadOnCloudinary,
    deleteFromCloudinary
}