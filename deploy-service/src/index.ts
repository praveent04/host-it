import { commandOptions, createClient } from "redis";
import { copyFinalDist, downloadS3Folder } from "./aws";
import { buildProject, cleanupProject } from "./utils";
const express = require('express');
import dotenv from 'dotenv';

dotenv.config();

const redisHost = process.env.REDIS_URL;
const redisPort = 18948;
const redisPassword = process.env.REDIS_PASSWORD;

// Create an Express application
const app = express();
const PORT = process.env.PORT || 3000;

// Start the Express server
app.listen(PORT, () => {
    console.log(`Express server is running on port ${PORT}`);
});

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

let publisher: any;
let subscriber: any;

async function main() {
    const clients = await createRedisClients();
    publisher = clients.publisher;
    subscriber = clients.subscriber;

    while (true) {
        try {
            const res = await subscriber.brPop(
                commandOptions({ isolated: true }),
                'build-queue',
                0
            );

            // @ts-ignore
            const id = res.element;

            try {
                await downloadS3Folder(`output/${id}`);
                await buildProject(id);
                await copyFinalDist(id);
                await publisher.hSet("status", id, "deployed");
                
                await cleanupProject(id);
            } catch (error) {
                console.error(`Error processing build ${id}:`, error);
                await publisher.hSet("status", id, "error");
                
                await cleanupProject(id);
            }
        } catch (error) {
            console.error("Error in main loop:", error);
        }
    }
}

main();
0