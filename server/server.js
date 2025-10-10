import app from "./app.js";
import {createTables} from './utils/createTables.js';
import {v2 as cloudinary} from "cloudinary";

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLIENT_NAME,
    api_key : process.env.CLOUDINARY_CLIENT_API,
    api_secret : process.env.CLOUDINARY_CLIENT_SECRET
})

createTables();

app.listen(process.env.PORT, () => {
    console.log(`Server listening at port ${process.env.PORT}`);
})