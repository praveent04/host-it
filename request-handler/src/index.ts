import { S3 } from "aws-sdk";
import express from "express"

const s3 = new S3({
    accessKeyId: "ed8dcfc36955f5e6f10051e1b0b1b5a3",
    secretAccessKey: "fcc602ba9e021f7c3bff8133f919f7f1db52b551dca2efe06547a4041e66253d",
    endpoint: "https://e5377c689da659b2478c8d6909161663.r2.cloudflarestorage.com"
});

const app = express()


app.get("/*", async (req,res) =>{

    const host = req.hostname;
    console.log(host);
    const id = host.split(".")[0];
    const filePath = req.path;

    const content = await s3.getObject({
        Bucket: "vercel",
        Key: `dist/${id}${filePath}`
    }).promise();

    const type = filePath.endsWith("html") ? "text/html" : filePath.endsWith("css") ? 
    "text/css" : "application/javascript"
    res.set("content-type",type);
    res.send(content.Body);
})

app.listen(3001)

