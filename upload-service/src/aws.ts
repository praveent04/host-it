import { S3 } from "aws-sdk";
import fs from "fs";
import path from "path";

const s3 = new S3({
    accessKeyId: "ed8dcfc36955f5e6f10051e1b0b1b5a3",
    secretAccessKey: "fcc602ba9e021f7c3bff8133f919f7f1db52b551dca2efe06547a4041e66253d",
    endpoint: "https://e5377c689da659b2478c8d6909161663.r2.cloudflarestorage.com"
});

export const uploadFile = async (fileName: string, localFilePath: string) => {
    const fileContent = fs.readFileSync(localFilePath);
    // Convert backslashes to forward slashes
    const normalizedFileName = fileName.replace(/\\/g, '/');
    
    const response = await s3.upload({
        Body: fileContent,
        Bucket: "vercel",
        Key: normalizedFileName,
    }).promise();
    
    console.log(response);
}
