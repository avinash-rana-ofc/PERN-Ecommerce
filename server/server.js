import app from "./app.js";
import { connectDatabase } from "./database/db.js";
import {v2 as cloudinary} from "cloudinary";

await connectDatabase();

cloudinary.config({
    cloud_name : process.env.CLOUDINARY_CLIENT_NAME,
    api_key : process.env.CLOUDINARY_CLIENT_API,
    api_secret : process.env.CLOUDINARY_CLIENT_SECRET
});

app.listen(process.env.PORT, () => {
    console.log(`Server listening at port ${process.env.PORT}`);
});