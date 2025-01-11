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

// Redis connection details
const redisHost = process.env.REDIS_URL;
const redisPort = 18948;
const redisPassword = process.env.REDIS_PASSWORD;

async function createRedisClients() {
    const publisher = createClient({
        socket: {
            host: redisHost,
            port: redisPort,
        },
        password: redisPassword
    });
    
    publisher.on('error', (err) => {
        console.error('Redis Publisher Connection Error:', err);
    });

    await publisher.connect();
    console.log('Publisher connected');

    const subscriber = createClient({
        socket: {
            host: redisHost,
            port: redisPort,
        },
        password: redisPassword
    });
    
    subscriber.on('error', (err) => {
        console.error('Redis Subscriber Connection Error:', err);
    });

    await subscriber.connect();
    console.log('Subscriber connected');

    return { publisher, subscriber };
}

const app = express();
app.use(cors());
app.use(express.json());

let publisher: any;
let subscriber: any;

// Helper function to delete directory recursively
async function deleteDirectory(dirPath: string) {
    try {
        await fs.rm(dirPath, { recursive: true, force: true });
        console.log(`Directory ${dirPath} deleted successfully`);
    } catch (err) {
        console.error(`Error deleting directory ${dirPath}:`, err);
    }
}

(async () => {
    try {
        const clients = await createRedisClients();
        publisher = clients.publisher;
        subscriber = clients.subscriber;

        app.post("/deploy", async (req, res) => {
            const repoUrl = req.body.repoUrl;
            const id = generate();
            const outputPath = path.join(__dirname, `output/${id}`);

            try {
                await simpleGit().clone(repoUrl, outputPath);
                const files = getAllFiles(outputPath);

                for (const file of files) {
                    await uploadFile(file.slice(__dirname.length + 1), file);
                }

                await publisher.lPush("build-queue", id);
                await publisher.hSet("status", id, "uploaded");

                await deleteDirectory(outputPath);

                res.json({ id: id });
            } catch (error) {
                await deleteDirectory(outputPath);
                console.error("Error in deploy:", error);
                res.status(500).json({ error: "Deployment failed" });
            }
        });

        app.get("/status", async (req, res) => {
            const id = req.query.id as string;
            try {
                const response = await subscriber.hGet("status", id);
                res.json({ status: response });
            } catch (error) {
                console.error("Error fetching status:", error);
                res.status(500).json({ error: "Failed to fetch status" });
            }
        });

        app.listen(3000, () => {
            console.log("Server is running on port 3000");
        });
    } catch (error) {
        console.error("Failed to initialize Redis clients:", error);
        process.exit(1);
    }
})();
