"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
/* eslint-disable global-require */
var electron_1 = require("electron");
var events_1 = __importDefault(require("events"));
var fs = __importStar(require("fs"));
var event_1 = __importDefault(require("./helper/event"));
var getDisplay_1 = __importDefault(require("./helper/getDisplay"));
var padStart_1 = __importDefault(require("./helper/padStart"));
var remoteMain = require('@electron/remote/main');
// ===== etsBridge 截图支持 =====
var etsBridge = null;
try {
    etsBridge = require('ets_bridge_addon.node');
    console.log('[window.ts] etsBridge loaded:', Object.keys(etsBridge));
}
catch (e) {
    console.log('[window.ts] etsBridge not available');
}
var Window = /** @class */ (function (_super) {
    __extends(Window, _super);
    function Window(opts) {
        var _this = _super.call(this) || this;
        _this.$win = null;
        _this.$view = new electron_1.BrowserView({
            webPreferences: {
                preload: require.resolve('./preload.js'),
                nodeIntegration: true,
                contextIsolation: true,
            },
        });
        _this.isReady = new Promise(function (resolve) {
            electron_1.ipcMain.once("SCREENSHOTS:".concat(_this.winId, ":ready"), function () {
                console.log("[window.ts] SCREENSHOTS:".concat(_this.winId, ":ready received"));
                resolve();
            });
        });
        _this.display = opts === null || opts === void 0 ? void 0 : opts.display;
        _this.singleWindow = (opts === null || opts === void 0 ? void 0 : opts.singleWindow) || false;
        _this.listenIpc();
        // 加载编辑器 HTML
        var editorHtml = (opts === null || opts === void 0 ? void 0 : opts.editorHtmlPath)
            || require.resolve('@qt/react-screenshots/electron/electron.html');
        console.log('[window.ts] loading editor HTML:', editorHtml);
        _this.$view.webContents.loadURL("file://".concat(editorHtml));
        if (opts === null || opts === void 0 ? void 0 : opts.lang) {
            _this.setLang(opts.lang);
        }
        remoteMain.enable(_this.$view.webContents);
        return _this;
    }
    Object.defineProperty(Window.prototype, "winId", {
        get: function () {
            return this.$view.webContents.id;
        },
        enumerable: false,
        configurable: true
    });
    Window.prototype.updateDisplay = function (display) {
        this.display = display;
    };
    Window.prototype.startCapture = function () {
        return __awaiter(this, void 0, void 0, function () {
            var display, imageUrl;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("[window.ts] startCapture:".concat(this.winId));
                        display = this.display || (0, getDisplay_1.default)();
                        console.log('[window.ts] waiting for capture and isReady...');
                        return [4 /*yield*/, Promise.all([this.capture(display), this.isReady])];
                    case 1:
                        imageUrl = (_a.sent())[0];
                        console.log('[window.ts] capture done, imageUrl length:', imageUrl === null || imageUrl === void 0 ? void 0 : imageUrl.length);
                        return [4 /*yield*/, this.createWindow(display)];
                    case 2:
                        _a.sent();
                        console.log("[window.ts] sending SCREENSHOTS:".concat(this.winId, ":capture"));
                        this.$view.webContents.send("SCREENSHOTS:".concat(this.winId, ":capture"), display, imageUrl);
                        return [2 /*return*/];
                }
            });
        });
    };
    Window.prototype.endCapture = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("[window.ts] endCapture:".concat(this.winId));
                        return [4 /*yield*/, this.reset()];
                    case 1:
                        _a.sent();
                        if (!this.$win) {
                            return [2 /*return*/];
                        }
                        this.$win.blur();
                        this.$win.blurWebView();
                        this.$win.unmaximize();
                        this.$win.removeBrowserView(this.$view);
                        if (this.singleWindow) {
                            this.$win.hide();
                        }
                        else {
                            this.$win.destroy();
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    Window.prototype.setLang = function (lang) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("[window.ts] setLang:".concat(this.winId));
                        return [4 /*yield*/, this.isReady];
                    case 1:
                        _a.sent();
                        this.$view.webContents.send("SCREENSHOTS:".concat(this.winId, ":setLang"), lang);
                        return [2 /*return*/];
                }
            });
        });
    };
    Window.prototype.sendEvent = function (channel, payload) {
        this.$view.webContents.send("SCREENSHOTS:".concat(this.winId, ":").concat(channel), payload);
    };
    Window.prototype.reset = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.$view.webContents.send("SCREENSHOTS:".concat(this.winId, ":reset"));
                        return [4 /*yield*/, Promise.race([
                                new Promise(function (resolve) {
                                    setTimeout(function () { return resolve(); }, 50);
                                }),
                                new Promise(function (resolve) {
                                    electron_1.ipcMain.once("SCREENSHOTS:".concat(_this.winId, ":reset"), function () { return resolve(); });
                                }),
                            ])];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Window.prototype.createWindow = function (display) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var windowTypes;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: return [4 /*yield*/, this.reset()];
                    case 1:
                        _c.sent();
                        if (!this.$win || ((_b = (_a = this.$win) === null || _a === void 0 ? void 0 : _a.isDestroyed) === null || _b === void 0 ? void 0 : _b.call(_a))) {
                            windowTypes = {
                                darwin: 'panel',
                                linux: undefined,
                                win32: 'toolbar',
                            };
                            this.$win = new electron_1.BrowserWindow({
                                title: 'screenshots',
                                x: display.x,
                                y: display.y,
                                width: display.width,
                                height: display.height,
                                useContentSize: true,
                                type: windowTypes[process.platform],
                                frame: false,
                                show: false,
                                autoHideMenuBar: true,
                                transparent: true,
                                resizable: false,
                                movable: false,
                                minimizable: false,
                                maximizable: false,
                                focusable: true,
                                skipTaskbar: true,
                                alwaysOnTop: true,
                                fullscreen: false,
                                fullscreenable: false,
                                backgroundColor: '#00000000',
                                titleBarStyle: 'hidden',
                                hasShadow: false,
                                paintWhenInitiallyHidden: false,
                                roundedCorners: false,
                                enableLargerThanScreen: false,
                                acceptFirstMouse: true,
                            });
                            this.emit('windowCreated', this.$win);
                            this.$win.addListener('closed', function () {
                                _this.emit('windowClosed', _this.$win);
                                _this.$win = null;
                            });
                        }
                        this.$win.setBrowserView(this.$view);
                        if (process.platform === 'darwin') {
                            this.$win.setWindowButtonVisibility(false);
                        }
                        if (process.platform !== 'win32') {
                            this.$win.setVisibleOnAllWorkspaces(true, {
                                visibleOnFullScreen: true,
                                skipTransformProcessType: true,
                            });
                        }
                        this.$win.blur();
                        this.$win.setBounds(display);
                        this.$view.setBounds({
                            x: 0,
                            y: 0,
                            width: display.width,
                            height: display.height,
                        });
                        this.$win.setAlwaysOnTop(true, 'screen-saver');
                        this.$win.show();
                        console.log('[window.ts] window shown, display:', display);
                        return [2 /*return*/];
                }
            });
        });
    };
    // eslint-disable-next-line class-methods-use-this
    Window.prototype.capture = function (display) {
        return __awaiter(this, void 0, void 0, function () {
            var result, parsed, err_1, NodeScreenshots, capturer, image, err_2, sourcesOptions, sources, source;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log('[window.ts] capture() called');
                        if (!etsBridge) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        console.log('[window.ts] capture using etsBridge');
                        return [4 /*yield*/, etsBridge.callAsync('screenCapture', JSON.stringify({ mode: 'full_png' }))];
                    case 2:
                        result = _a.sent();
                        parsed = JSON.parse(result);
                        if (parsed.code === 0 && parsed.data) {
                            console.log('[window.ts] capture etsBridge success, data len:', parsed.data.length);
                            return [2 /*return*/, "data:image/png;base64,".concat(parsed.data)];
                        }
                        console.log('[window.ts] capture etsBridge failed:', parsed);
                        throw new Error("etsBridge error: ".concat(result));
                    case 3:
                        err_1 = _a.sent();
                        console.log('[window.ts] capture etsBridge error:', err_1);
                        return [3 /*break*/, 4];
                    case 4:
                        _a.trys.push([4, 7, , 9]);
                        return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('node-screenshots')); })];
                    case 5:
                        NodeScreenshots = (_a.sent()).Screenshots;
                        capturer = NodeScreenshots.fromPoint(display.x + display.width / 2, display.y + display.height / 2);
                        if (!capturer) {
                            throw new Error("NodeScreenshots.fromDisplay(".concat(display.id, ") get null"));
                        }
                        return [4 /*yield*/, capturer.capture()];
                    case 6:
                        image = _a.sent();
                        return [2 /*return*/, "data:image/png;base64,".concat(image.toString('base64'))];
                    case 7:
                        err_2 = _a.sent();
                        console.log('[window.ts] capture node-screenshots error:', err_2);
                        sourcesOptions = {
                            types: ['screen'],
                            thumbnailSize: {
                                width: Math.floor(display.width * display.scaleFactor),
                                height: Math.floor(display.height * display.scaleFactor),
                            },
                        };
                        return [4 /*yield*/, electron_1.desktopCapturer.getSources(sourcesOptions)];
                    case 8:
                        sources = _a.sent();
                        source = void 0;
                        if (sources.length === 1) {
                            source = sources[0];
                        }
                        else {
                            source = sources.find(function (item) { return item.display_id === display.id.toString()
                                || item.id.startsWith("screen:".concat(display.id, ":")); });
                        }
                        if (!source) {
                            throw new Error("Can't find screen source");
                        }
                        return [2 /*return*/, source.thumbnail.toDataURL()];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    Window.prototype.listenIpc = function () {
        var _this = this;
        electron_1.ipcMain.on("SCREENSHOTS:".concat(this.winId, ":ok"), function (e, buffer, data) {
            console.log("[window.ts] SCREENSHOTS:".concat(_this.winId, ":ok buffer.length:"), buffer.length);
            var event = new event_1.default();
            _this.emit('ok', event, buffer, data);
            if (event.defaultPrevented) {
                return;
            }
            electron_1.clipboard.writeImage(electron_1.nativeImage.createFromBuffer(buffer));
            _this.endCapture();
        });
        electron_1.ipcMain.on("SCREENSHOTS:".concat(this.winId, ":cancel"), function () {
            console.log("[window.ts] SCREENSHOTS:".concat(_this.winId, ":cancel"));
            var event = new event_1.default();
            _this.emit('cancel', event);
            if (event.defaultPrevented) {
                return;
            }
            _this.endCapture();
        });
        electron_1.ipcMain.on("SCREENSHOTS:".concat(this.winId, ":save"), function (e, buffer, data) { return __awaiter(_this, void 0, void 0, function () {
            var event, time, year, month, date, hours, minutes, seconds, milliseconds, _a, canceled, filePath;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log("[window.ts] SCREENSHOTS:".concat(this.winId, ":save buffer.length:"), buffer.length);
                        event = new event_1.default();
                        this.emit('save', event, buffer, data);
                        if (event.defaultPrevented || !this.$win) {
                            return [2 /*return*/];
                        }
                        time = new Date();
                        year = time.getFullYear();
                        month = (0, padStart_1.default)(time.getMonth() + 1, 2, '0');
                        date = (0, padStart_1.default)(time.getDate(), 2, '0');
                        hours = (0, padStart_1.default)(time.getHours(), 2, '0');
                        minutes = (0, padStart_1.default)(time.getMinutes(), 2, '0');
                        seconds = (0, padStart_1.default)(time.getSeconds(), 2, '0');
                        milliseconds = (0, padStart_1.default)(time.getMilliseconds().toString(), 3, '0');
                        this.$win.setAlwaysOnTop(false);
                        return [4 /*yield*/, electron_1.dialog.showSaveDialog(this.$win, {
                                defaultPath: "".concat(year).concat(month).concat(date).concat(hours).concat(minutes).concat(seconds).concat(milliseconds, ".png"),
                                filters: [
                                    { name: 'Image (png)', extensions: ['png'] },
                                    { name: 'All Files', extensions: ['*'] },
                                ],
                            })];
                    case 1:
                        _a = _b.sent(), canceled = _a.canceled, filePath = _a.filePath;
                        if (!this.$win) {
                            this.$view.webContents.send("SCREENSHOTS:".concat(this.winId, ":afterSave"));
                            this.emit('afterSave', new event_1.default(), buffer, data, false);
                            return [2 /*return*/];
                        }
                        this.$win.setAlwaysOnTop(true);
                        if (canceled || !filePath) {
                            this.$view.webContents.send("SCREENSHOTS:".concat(this.winId, ":afterSave"));
                            this.emit('afterSave', new event_1.default(), buffer, data, false);
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, fs.promises.writeFile(filePath, buffer)];
                    case 2:
                        _b.sent();
                        this.$view.webContents.send("SCREENSHOTS:".concat(this.winId, ":afterSave"));
                        this.emit('afterSave', new event_1.default(), buffer, data, true);
                        this.endCapture();
                        return [2 /*return*/];
                }
            });
        }); });
        electron_1.ipcMain.on("SCREENSHOTS:".concat(this.winId, ":selected"), function () {
            console.log("[window.ts] SCREENSHOTS:".concat(_this.winId, ":selected"));
            _this.emit('selected');
        });
    };
    return Window;
}(events_1.default));
exports.default = Window;
