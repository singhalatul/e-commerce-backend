import mongoose from 'mongoose';
import { DB_NAME } from '../constants';

const connectDB = async()=>{

    try {
        const connectionInstance = await mongoose.connet(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`\n Mongo db connected !! DB HOST ${connectionInstance.connection.host}`)
    } catch (error) {
        console.log("Mongodb connection error ",error)
        process.exit(1)
    }
}

export default connectDB