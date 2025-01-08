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

 
export async function downloadS3Folder(prefix: string) {
    const allFiles = await s3.listObjectsV2({
        Bucket: process.env.AWS_BUCKET!,
        Prefix: prefix
    }).promise();
    
    // 
    const allPromises = allFiles.Contents?.map(async ({Key}) => {
        return new Promise(async (resolve) => {
            if (!Key) {
                resolve("");
                return;
            }
            const finalOutputPath = path.join(__dirname, Key);
            const outputFile = fs.createWriteStream(finalOutputPath);
            const dirName = path.dirname(finalOutputPath);
            if (!fs.existsSync(dirName)){
                fs.mkdirSync(dirName, { recursive: true });
            }
            s3.getObject({
                Bucket: process.env.AWS_BUCKET!,
                Key
            }).createReadStream().pipe(outputFile).on("finish", () => {
                resolve("");
            })
        })
    }) || []
    console.log("awaiting");

    await Promise.all(allPromises?.filter(x => x !== undefined));
}

export async function copyFinalDist(id: string) {
    const folderPath = path.join(__dirname, `output/${id}/dist`);
    try {
        const allFiles = getAllFiles(folderPath);
        const uploadPromises = allFiles.map(file => {
            return uploadFile(
                `dist/${id}/` + file.slice(folderPath.length + 1), 
                file
            );
        });
        await Promise.all(uploadPromises);
    } catch (error) {
        console.error(`Error copying dist files for ${id}:`, error);
        throw error; // Propagate error to main function
    }
}


const getAllFiles = (folderPath: string) => {
    if (!fs.existsSync(folderPath)) {
        console.error(`Directory does not exist: ${folderPath}`);
        return [];
    }
    let response: string[] = [];

    const allFilesAndFolders = fs.readdirSync(folderPath);
    allFilesAndFolders.forEach(file => {
        const fullFilePath = path.join(folderPath, file);
        if (fs.statSync(fullFilePath).isDirectory()) {
            response = response.concat(getAllFiles(fullFilePath))
        } else {
            response.push(fullFilePath);
        }
    });
    return response;
}

 const uploadFile = async (fileName: string, localFilePath: string) => {
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