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
exports.uploadFile = void 0;
const aws_sdk_1 = require("aws-sdk");
const fs_1 = __importDefault(require("fs"));
const s3 = new aws_sdk_1.S3({
    accessKeyId: "ed8dcfc36955f5e6f10051e1b0b1b5a3",
    secretAccessKey: "fcc602ba9e021f7c3bff8133f919f7f1db52b551dca2efe06547a4041e66253d",
    endpoint: "https://e5377c689da659b2478c8d6909161663.r2.cloudflarestorage.com"
});
const uploadFile = (fileName, localFilePath) => __awaiter(void 0, void 0, void 0, function* () {
    const fileContent = fs_1.default.readFileSync(localFilePath);
    // Convert backslashes to forward slashes
    const normalizedFileName = fileName.replace(/\\/g, '/');
    const response = yield s3.upload({
        Body: fileContent,
        Bucket: "vercel",
        Key: normalizedFileName,
    }).promise();
    console.log(response);
});
exports.uploadFile = uploadFile;
