import { commandOptions, createClient } from "redis";
import { copyFinalDist, downloadS3Folder } from "./aws";
import { buildProject, cleanupProject } from "./utils";
import dotenv from 'dotenv';

dotenv.config();

// Redis connection details
const redisHost: string = process.env.REDIS_HOST || "your-redis-host";
const redisPort: number = parseInt(process.env.REDIS_PORT || "6379", 10);
const redisPassword: string = process.env.REDIS_PASSWORD || "your-redis-password";

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
