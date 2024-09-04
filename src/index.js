import app from './app'
import dotenv from 'dotenv'
import connectDB from './db/db';
dotenv.config({
    path:'./.env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log(`app is successfully listen on ${process.env.PORT}`)
        app.on("err",(err)=>{
            console.log("express error :",err)
            throw err;
        })
    })
})
.catch((err)=>{
    console.log("MongoDB connection error!! :",err)
})

