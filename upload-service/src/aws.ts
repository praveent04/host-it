import { S3 } from "aws-sdk";
import fs from "fs";
import path from "path";

import dotenv from 'dotenv';

dotenv.config();

const s3 = new S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    endpoint: process.env.AWS_ENDPOINT!
});


export const uploadFile = async (fileName: string, localFilePath: string) => {
    const fileContent = fs.readFileSync(localFilePath);
    // Convert backslashes to forward slashes
    const normalizedFileName = fileName.replace(/\\/g, '/');
    
    const response = await s3.upload({
        Body: fileContent,
        Bucket: process.env.AWS_BUCKET!,
        Key: normalizedFileName,
    }).promise();
    
    console.log(response);
}
