import { exec, spawn } from "child_process";
import path from "path";
import fs from 'fs/promises';

export function buildProject(id: string) {
    return new Promise((resolve) => {
        const child = exec(`cd ${path.join(__dirname, `output/${id}`)} && npm install && npm run build`)

        child.stdout?.on('data', function(data) {
            console.log('stdout: ' + data);
        });
        child.stderr?.on('data', function(data) {
            console.log('stderr: ' + data);
        });

        child.on('close', function(code) {
           resolve("")
        });

    })

}  

export async function cleanupProject(id: string) {
    const outputPath = path.join(__dirname, `output/${id}`);
    try {
        await fs.rm(outputPath, { recursive: true, force: true });
        console.log(`Cleaned up build files for ${id}`);
    } catch (error) {
        console.error(`Error cleaning up ${id}:`, error);
    }
}