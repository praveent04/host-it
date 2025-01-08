import { commandOptions, createClient } from "redis";
import { copyFinalDist, downloadS3Folder } from "./aws";
import { buildProject, cleanupProject  } from "./utils";

import dotenv from 'dotenv';

dotenv.config();

const subscriber = createClient({
    url: process.env.REDIS_URL
});

subscriber.connect();

const publisher = createClient({
    url: process.env.REDIS_URL
});

publisher.connect();


async function main() {
    while(1) {
        try {
            const res = await subscriber.brPop(
                commandOptions({isolated: true}),
                'build-queue',
                0
            );
            
            //@ts-ignore
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
