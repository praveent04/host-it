"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const utils_1 = require("./utils");
const simple_git_1 = __importDefault(require("simple-git"));
const file_1 = require("./file");
const path_1 = __importDefault(require("path"));
const aws_1 = require("./aws");
const redis_1 = require("redis");
const promises_1 = __importDefault(require("fs/promises"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Redis connection details
const redisHost = process.env.REDIS_URL;
const redisPort = 18948;
const redisPassword = process.env.REDIS_PASSWORD;
function createRedisClients() {
    return __awaiter(this, void 0, void 0, function* () {
        const publisher = (0, redis_1.createClient)({
            socket: {
                host: redisHost,
                port: redisPort,
            },
            password: redisPassword
        });
        publisher.on('error', (err) => {
            console.error('Redis Publisher Connection Error:', err);
        });
        yield publisher.connect();
        console.log('Publisher connected');
        const subscriber = (0, redis_1.createClient)({
            socket: {
                host: redisHost,
                port: redisPort,
            },
            password: redisPassword
        });
        subscriber.on('error', (err) => {
            console.error('Redis Subscriber Connection Error:', err);
        });
        yield subscriber.connect();
        console.log('Subscriber connected');
        return { publisher, subscriber };
    });
}
// Function to test Redis connection
function testRedisConnection(client) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const pong = yield client.ping();
            console.log(`Redis connection test successful: ${pong}`);
            return true;
        }
        catch (error) {
            console.error("Error testing Redis connection:", error);
            return false;
        }
    });
}
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
let publisher;
let subscriber;
function deleteDirectory(dirPath) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            yield promises_1.default.rm(dirPath, { recursive: true, force: true });
            console.log(`Directory ${dirPath} deleted successfully`);
        }
        catch (err) {
            console.error(`Error deleting directory ${dirPath}:`, err);
        }
    });
}
(() => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const clients = yield createRedisClients();
        publisher = clients.publisher;
        subscriber = clients.subscriber;
        yield testRedisConnection(publisher);
        yield testRedisConnection(subscriber);
        app.post("/deploy", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
            const repoUrl = req.body.repoUrl;
            const id = (0, utils_1.generate)();
            const outputPath = path_1.default.join(__dirname, `output/${id}`);
            try {
                yield (0, simple_git_1.default)().clone(repoUrl, outputPath);
                const files = (0, file_1.getAllFiles)(outputPath);
                for (const file of files) {
                    yield (0, aws_1.uploadFile)(file.slice(__dirname.length + 1), file);
                }
                yield publisher.lPush("build-queue", id);
                yield publisher.hSet("status", id, "uploaded");
                yield deleteDirectory(outputPath);
                res.json({ id: id });
            }
            catch (error) {
                yield deleteDirectory(outputPath);
                console.error("Error in deploy:", error);
                res.status(500).json({ error: "Deployment failed" });
            }
        }));
        app.get("/status", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
            const id = req.query.id;
            try {
                const response = yield subscriber.hGet("status", id);
                res.json({ status: response });
            }
            catch (error) {
                console.error("Error fetching status:", error);
                res.status(500).json({ error: "Failed to fetch status" });
            }
        }));
        app.listen(3000, () => {
            console.log("Server is running on port 3000");
        });
    }
    catch (error) {
        console.error("Failed to initialize Redis clients:", error);
        process.exit(1);
    }
}))();
