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
const promises_1 = __importDefault(require("fs/promises")); // Import fs promises for directory deletion
const publisher = (0, redis_1.createClient)({
    url: 'redis://default:pkts@12345@127.0.0.1:6379'
});
publisher.connect();
const subscriber = (0, redis_1.createClient)({
    url: 'redis://default:pkts@12345@127.0.0.1:6379'
});
subscriber.connect();
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Helper function to delete directory recursively
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
app.post("/deploy", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const repoUrl = req.body.repoUrl;
    const id = (0, utils_1.generate)();
    const outputPath = path_1.default.join(__dirname, `output/${id}`);
    try {
        // Clone repository
        yield (0, simple_git_1.default)().clone(repoUrl, outputPath);
        // Get all files
        const files = (0, file_1.getAllFiles)(outputPath);
        // Upload files to S3
        for (const file of files) {
            yield (0, aws_1.uploadFile)(file.slice(__dirname.length + 1), file);
        }
        // Push to Redis
        yield publisher.lPush("build-queue", id);
        yield publisher.hSet("status", id, "uploaded");
        // Delete the directory after successful upload
        yield deleteDirectory(outputPath);
        res.json({
            id: id
        });
    }
    catch (error) {
        // Clean up in case of error
        yield deleteDirectory(outputPath);
        console.error("Error in deploy:", error);
        res.status(500).json({
            error: "Deployment failed"
        });
    }
}));
app.get("/status", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const id = req.query.id;
    const response = yield subscriber.hGet("status", id);
    res.json({
        status: response
    });
}));
app.listen(3000);
