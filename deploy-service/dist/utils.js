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
exports.buildProject = buildProject;
exports.cleanupProject = cleanupProject;
const child_process_1 = require("child_process");
const path_1 = __importDefault(require("path"));
const promises_1 = __importDefault(require("fs/promises"));
function buildProject(id) {
    return new Promise((resolve) => {
        var _a, _b;
        const child = (0, child_process_1.exec)(`cd ${path_1.default.join(__dirname, `output/${id}`)} && npm install && npm run build`);
        (_a = child.stdout) === null || _a === void 0 ? void 0 : _a.on('data', function (data) {
            console.log('stdout: ' + data);
        });
        (_b = child.stderr) === null || _b === void 0 ? void 0 : _b.on('data', function (data) {
            console.log('stderr: ' + data);
        });
        child.on('close', function (code) {
            resolve("");
        });
    });
}
function cleanupProject(id) {
    return __awaiter(this, void 0, void 0, function* () {
        const outputPath = path_1.default.join(__dirname, `output/${id}`);
        try {
            yield promises_1.default.rm(outputPath, { recursive: true, force: true });
            console.log(`Cleaned up build files for ${id}`);
        }
        catch (error) {
            console.error(`Error cleaning up ${id}:`, error);
        }
    });
}
