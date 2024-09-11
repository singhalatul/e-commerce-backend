const asyncHandler = (func)=>{
    return (req,res,next)=>{
        Promise.resolve(func(req,res,next))
        .catch((err)=>{
            next(err);
        })
    }
}


// const asyncHandler = (func)=>{
//     async(req,res,next)=>{
//         try {
//             func(req,res,next)
//         } catch (error) {
//             res.send(err.code||500).json({
//                 success:false,
//                 message:err.message
//             })
//         }
//     }
// }
export {asyncHandler}

