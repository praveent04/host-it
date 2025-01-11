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
const redis_1 = require("redis");
const aws_1 = require("./aws");
const utils_1 = require("./utils");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
// Redis connection details
const redisHost = process.env.REDIS_HOST || "your-redis-host";
const redisPort = parseInt(process.env.REDIS_PORT || "6379", 10);
const redisPassword = process.env.REDIS_PASSWORD || "your-redis-password";
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
let publisher;
let subscriber;
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const clients = yield createRedisClients();
        publisher = clients.publisher;
        subscriber = clients.subscriber;
        while (true) {
            try {
                const res = yield subscriber.brPop((0, redis_1.commandOptions)({ isolated: true }), 'build-queue', 0);
                // @ts-ignore
                const id = res.element;
                try {
                    yield (0, aws_1.downloadS3Folder)(`output/${id}`);
                    yield (0, utils_1.buildProject)(id);
                    yield (0, aws_1.copyFinalDist)(id);
                    yield publisher.hSet("status", id, "deployed");
                    yield (0, utils_1.cleanupProject)(id);
                }
                catch (error) {
                    console.error(`Error processing build ${id}:`, error);
                    yield publisher.hSet("status", id, "error");
                    yield (0, utils_1.cleanupProject)(id);
                }
            }
            catch (error) {
                console.error("Error in main loop:", error);
            }
        }
    });
}
main();
