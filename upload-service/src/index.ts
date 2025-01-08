import express from "express";
import cors from "cors";
import { generate } from "./utils";
import simpleGit from "simple-git";
import { getAllFiles } from "./file";
import path from "path";
import { uploadFile } from "./aws";
import { createClient } from "redis";
import fs from 'fs/promises';  


import dotenv from 'dotenv';

dotenv.config();

const publisher = createClient({
    url: process.env.REDIS_URL
});
publisher.connect();

const subscriber = createClient({
    url: process.env.REDIS_URL
});
subscriber.connect();

const app = express();
app.use(cors())
app.use(express.json());

// Helper function to delete directory recursively
async function deleteDirectory(dirPath: string) {
    try {
        await fs.rm(dirPath, { recursive: true, force: true });
        console.log(`Directory ${dirPath} deleted successfully`);
    } catch (err) {
        console.error(`Error deleting directory ${dirPath}:`, err);
    }
}

app.post("/deploy", async (req, res) => {
    const repoUrl = req.body.repoUrl;
    const id = generate();
    const outputPath = path.join(__dirname, `output/${id}`);

    try {
        // Clone repository
        await simpleGit().clone(repoUrl, outputPath);

        // Get all files
        const files = getAllFiles(outputPath);
        
        // Upload files to S3
        for (const file of files) {
            await uploadFile(file.slice(__dirname.length + 1), file);
        }

        // Push to Redis
        await publisher.lPush("build-queue", id);
        await publisher.hSet("status", id, "uploaded");

        // Delete the directory after successful upload
        await deleteDirectory(outputPath);

        res.json({
            id: id
        });
    } catch (error) {
        // Clean up in case of error
        await deleteDirectory(outputPath);
        console.error("Error in deploy:", error);
        res.status(500).json({
            error: "Deployment failed"
        });
    }
});

app.get("/status", async(req,res) => {
    const id = req.query.id;
    const response = await subscriber.hGet("status", id as string);
    res.json({
        status: response
    });
});

app.listen(3000);
