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
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.captureScreen = exports.areaCapture = exports.isHarmonyOS = void 0;
exports.isHarmonyOS = process.platform === 'openharmony';
var etsBridge = null;
try {
    // eslint-disable-next-line global-require, @typescript-eslint/no-var-requires
    etsBridge = require('ets_bridge_addon.node');
    // eslint-disable-next-line no-console
    console.log('[harmony.ts] etsBridge loaded:', Object.keys(etsBridge));
}
catch (e) {
    // eslint-disable-next-line no-console
    console.log('[harmony.ts] etsBridge not available');
}
/**
 * 区域截图（用户交互选区）
 * 走 screenshot.pick()，返回截取的图片 base64
 */
function areaCapture(logger) {
    return __awaiter(this, void 0, void 0, function () {
        var result, parsed, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!etsBridge) {
                        return [2 /*return*/, null];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    logger('[harmony.ts] areaCapture start');
                    return [4 /*yield*/, etsBridge.callAsync('screenCapture', JSON.stringify({ mode: 'area' }))];
                case 2:
                    result = _a.sent();
                    parsed = JSON.parse(result);
                    if (parsed.code === 0 && parsed.data) {
                        logger('[harmony.ts] areaCapture success, data len:', parsed.data.length);
                        return [2 /*return*/, "data:image/png;base64,".concat(parsed.data)];
                    }
                    logger('[harmony.ts] areaCapture failed:', parsed);
                    return [2 /*return*/, null];
                case 3:
                    err_1 = _a.sent();
                    logger('[harmony.ts] areaCapture error:', err_1);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.areaCapture = areaCapture;
/**
 * 全屏截图
 * 走 screenshot.capture({displayId})，返回全屏图片 base64
 */
function captureScreen(display, logger) {
    return __awaiter(this, void 0, void 0, function () {
        var captureMode, result, parsed, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!etsBridge) {
                        return [2 /*return*/, null];
                    }
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    logger('[harmony.ts] captureScreen using etsBridge, display:', JSON.stringify({
                        id: display.id,
                        x: display.x,
                        y: display.y,
                        width: display.width,
                        height: display.height,
                    }));
                    captureMode = "full_".concat(display.id, "_png");
                    logger('[harmony.ts] captureScreen mode:', captureMode);
                    return [4 /*yield*/, etsBridge.callAsync('screenCapture', JSON.stringify({ mode: captureMode }))];
                case 2:
                    result = _a.sent();
                    parsed = JSON.parse(result);
                    if (parsed.code === 0 && parsed.data) {
                        logger('[harmony.ts] captureScreen etsBridge success, data len:', parsed.data.length);
                        return [2 /*return*/, "data:image/png;base64,".concat(parsed.data)];
                    }
                    logger('[harmony.ts] captureScreen etsBridge failed:', parsed);
                    return [2 /*return*/, null];
                case 3:
                    err_2 = _a.sent();
                    logger('[harmony.ts] captureScreen etsBridge error:', err_2);
                    return [2 /*return*/, null];
                case 4: return [2 /*return*/];
            }
        });
    });
}
exports.captureScreen = captureScreen;
