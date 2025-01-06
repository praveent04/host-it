import { commandOptions, createClient } from "redis";
import { copyFinalDist, downloadS3Folder } from "./aws";
import { buildProject } from "./utils";

const subscriber = createClient({
    url: 'redis://default:pkts@12345@127.0.0.1:6379'
});

subscriber.connect();

const publisher = createClient({
    url: 'redis://default:pkts@12345@127.0.0.1:6379'
});
publisher.connect();

async function main(){
    while(1){
        const res = await subscriber.brPop(
            commandOptions({isolated: true}),
            'build-queue',
            0
        );
        
        //@ts-ignore
        const id = res.element
        
        await downloadS3Folder(`output/${id}`)
        await buildProject(id);
        await copyFinalDist(id);
        publisher.hSet("status", id, "deployed");
    }
}

main();
