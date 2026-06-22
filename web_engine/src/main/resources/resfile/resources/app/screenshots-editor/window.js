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
var debug_1 = __importDefault(require("debug"));
var electron_1 = require("electron");
var events_1 = __importDefault(require("events"));
var fs_extra_1 = __importDefault(require("fs-extra"));
var event_1 = __importDefault(require("./helper/event"));
var getDisplay_1 = __importDefault(require("./helper/getDisplay"));
var padStart_1 = __importDefault(require("./helper/padStart"));
var remoteMain = require('@electron/remote/main');
// ===== 鸿蒙截图 bridge =====
var etsBridge = null;
try {
    // eslint-disable-next-line global-require, no-console
    etsBridge = require('ets_bridge_addon.node');
    // eslint-disable-next-line no-console
    console.log('[window.ts] etsBridge loaded:', Object.keys(etsBridge));
}
catch (e) {
    // eslint-disable-next-line no-console
    console.log('[window.ts] etsBridge not available:', e);
}
var Window = /** @class */ (function (_super) {
    __extends(Window, _super);
    function Window(opts) {
        var _this = _super.call(this) || this;
        // 截图窗口对象
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
                _this.logger("SCREENSHOTS:".concat(_this.winId, ":ready"));
                resolve();
            });
        });
        _this.display = opts === null || opts === void 0 ? void 0 : opts.display;
        _this.logger = (opts === null || opts === void 0 ? void 0 : opts.logger) || (0, debug_1.default)('electron-screenshots');
        _this.singleWindow = (opts === null || opts === void 0 ? void 0 : opts.singleWindow) || false;
        _this.listenIpc();
        _this.$view.webContents.loadURL("file://".concat(require.resolve('@qt/react-screenshots/electron/electron.html')));
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
    /**
     * 开始截图
     */
    Window.prototype.startCapture = function () {
        return __awaiter(this, void 0, void 0, function () {
            var display, imageUrl;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger("startCapture:".concat(this.winId));
                        display = this.display || (0, getDisplay_1.default)();
                        return [4 /*yield*/, Promise.all([this.capture(display), this.isReady])];
                    case 1:
                        imageUrl = (_a.sent())[0];
                        return [4 /*yield*/, this.createWindow(display)];
                    case 2:
                        _a.sent();
                        this.$view.webContents.send("SCREENSHOTS:".concat(this.winId, ":capture"), display, imageUrl);
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 结束截图
     */
    Window.prototype.endCapture = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger("endCapture:".concat(this.winId));
                        return [4 /*yield*/, this.reset()];
                    case 1:
                        _a.sent();
                        if (!this.$win) {
                            return [2 /*return*/];
                        }
                        // 先清除 Kiosk 模式，然后取消全屏才有效
                        // this.$win.setKiosk(false);
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
    /**
     * 设置语言
     */
    Window.prototype.setLang = function (lang) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger("setLang:".concat(this.winId), lang);
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
                        // 重置截图区域
                        this.$view.webContents.send("SCREENSHOTS:".concat(this.winId, ":reset"));
                        // 保证 UI 有足够的时间渲染
                        return [4 /*yield*/, Promise.race([
                                new Promise(function (resolve) {
                                    setTimeout(function () { return resolve(); }, 50);
                                }),
                                new Promise(function (resolve) {
                                    electron_1.ipcMain.once("SCREENSHOTS:".concat(_this.winId, ":reset"), function () { return resolve(); });
                                }),
                            ])];
                    case 1:
                        // 保证 UI 有足够的时间渲染
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 初始化窗口
     */
    Window.prototype.createWindow = function (display) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function () {
            var windowTypes;
            var _this = this;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0: 
                    // 重置截图区域
                    return [4 /*yield*/, this.reset()];
                    case 1:
                        // 重置截图区域
                        _c.sent();
                        // 复用未销毁的窗口
                        if (!this.$win || ((_b = (_a = this.$win) === null || _a === void 0 ? void 0 : _a.isDestroyed) === null || _b === void 0 ? void 0 : _b.call(_a))) {
                            windowTypes = {
                                darwin: 'panel',
                                // linux 必须设置为 undefined，否则会在部分系统上不能触发focus 事件
                                // https://github.com/nashaofu/screenshots/issues/203#issuecomment-1518923486
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
                                // focusable 必须设置为 true, 否则窗口不能及时响应esc按键，输入框也不能输入
                                focusable: true,
                                skipTaskbar: true,
                                alwaysOnTop: true,
                                /**
                                 * linux 下必须设置为false，否则不能全屏显示在最上层
                                 * mac 下设置为false，否则可能会导致程序坞不恢复问题，且与 kiosk 模式冲突
                                 */
                                fullscreen: false,
                                // mac fullscreenable 设置为 true 会导致应用崩溃
                                fullscreenable: false,
                                // kiosk: true,
                                backgroundColor: '#00000000',
                                titleBarStyle: 'hidden',
                                hasShadow: false,
                                paintWhenInitiallyHidden: false,
                                // mac 特有的属性
                                roundedCorners: false,
                                enableLargerThanScreen: false,
                                acceptFirstMouse: true,
                            });
                            this.emit('windowCreated', this.$win);
                            // this.$win.addListener('show', () => {
                            //   this.$win?.focus();
                            //   this.$win?.setKiosk(true);
                            // });
                            this.$win.addListener('closed', function () {
                                _this.emit('windowClosed', _this.$win);
                                _this.$win = null;
                            });
                        }
                        this.$win.setBrowserView(this.$view);
                        // 适定平台
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
                        return [2 /*return*/];
                }
            });
        });
    };
    Window.prototype.capture = function (display) {
        return __awaiter(this, void 0, void 0, function () {
            var result, parsed, err_1, NodeScreenshots, capturer, image, err_2, sourcesOptions, sources, source;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        this.logger("SCREENSHOTS:".concat(this.winId, ":capture"));
                        if (!etsBridge) return [3 /*break*/, 4];
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        this.logger("SCREENSHOTS:".concat(this.winId, ":capture using etsBridge"));
                        return [4 /*yield*/, etsBridge.callAsync('screenCapture', JSON.stringify({ mode: 'full_png' }))];
                    case 2:
                        result = _a.sent();
                        parsed = JSON.parse(result);
                        if (parsed.code === 0 && parsed.data) {
                            this.logger("SCREENSHOTS:".concat(this.winId, ":capture etsBridge success, data len:"), parsed.data.length);
                            return [2 /*return*/, "data:image/png;base64,".concat(parsed.data)];
                        }
                        this.logger("SCREENSHOTS:".concat(this.winId, ":capture etsBridge failed:"), parsed);
                        throw new Error("etsBridge error: ".concat(result));
                    case 3:
                        err_1 = _a.sent();
                        this.logger("SCREENSHOTS:".concat(this.winId, ":capture etsBridge error:"), err_1);
                        return [3 /*break*/, 4];
                    case 4:
                        _a.trys.push([4, 7, , 9]);
                        return [4 /*yield*/, Promise.resolve().then(function () { return __importStar(require('node-screenshots')); })];
                    case 5:
                        NodeScreenshots = (_a.sent()).Screenshots;
                        capturer = NodeScreenshots.fromPoint(display.x + display.width / 2, display.y + display.height / 2);
                        this.logger("SCREENSHOTS:".concat(this.winId, ":capture NodeScreenshots.fromPoint arguments %o"), display);
                        this.logger("SCREENSHOTS:".concat(this.winId, ":capture NodeScreenshots.fromPoint return %o"), capturer
                            ? {
                                id: capturer.id,
                                x: capturer.x,
                                y: capturer.y,
                                width: capturer.width,
                                height: capturer.height,
                                rotation: capturer.rotation,
                                scaleFactor: capturer.scaleFactor,
                                isPrimary: capturer.isPrimary,
                            }
                            : null);
                        if (!capturer) {
                            throw new Error("NodeScreenshots.fromDisplay(".concat(display.id, ") get null"));
                        }
                        return [4 /*yield*/, capturer.capture()];
                    case 6:
                        image = _a.sent();
                        return [2 /*return*/, "data:image/png;base64,".concat(image.toString('base64'))];
                    case 7:
                        err_2 = _a.sent();
                        this.logger("SCREENSHOTS:".concat(this.winId, ":capture NodeScreenshots capture() error %o"), err_2);
                        sourcesOptions = {
                            types: ['screen'],
                            thumbnailSize: {
                                width: Math.floor(display.width * display.scaleFactor),
                                height: Math.floor(display.height * display.scaleFactor),
                            },
                        };
                        this.logger("SCREENSHOTS:".concat(this.winId, ":sourcesOptions"), sourcesOptions);
                        return [4 /*yield*/, electron_1.desktopCapturer.getSources(sourcesOptions)];
                    case 8:
                        sources = _a.sent();
                        source = void 0;
                        // Linux系统上，screen.getDisplayNearestPoint 返回的 Display 对象的 id
                        // 和这里 source 对象上的 display_id(Linux上，这个值是空字符串) 或 id 的中间部分，都不一致
                        // 但是，如果只有一个显示器的话，其实不用判断，直接返回就行
                        if (sources.length === 1) {
                            source = sources[0];
                        }
                        else {
                            source = sources.find(function (item) { return item.display_id === display.id.toString() || item.id.startsWith("screen:".concat(display.id, ":")); });
                        }
                        if (!source) {
                            this.logger("SCREENSHOTS:".concat(this.winId, ":capture Can't find screen source. sources: %o, display: %o"), sources, display);
                            throw new Error("Can't find screen source");
                        }
                        return [2 /*return*/, source.thumbnail.toDataURL()];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * 绑定ipc时间处理
     */
    Window.prototype.listenIpc = function () {
        var _this = this;
        /**
         * OK事件
         */
        electron_1.ipcMain.on("SCREENSHOTS:".concat(this.winId, ":ok"), function (e, buffer, data) {
            _this.logger("SCREENSHOTS:".concat(_this.winId, ":ok buffer.length %d, data: %o"), buffer.length, data);
            var event = new event_1.default();
            _this.emit('ok', event, buffer, data);
            if (event.defaultPrevented) {
                return;
            }
            electron_1.clipboard.writeImage(electron_1.nativeImage.createFromBuffer(buffer));
            _this.endCapture();
        });
        /**
         * CANCEL事件
         */
        electron_1.ipcMain.on("SCREENSHOTS:".concat(this.winId, ":cancel"), function () {
            _this.logger("SCREENSHOTS:".concat(_this.winId, ":cancel"));
            var event = new event_1.default();
            _this.emit('cancel', event);
            if (event.defaultPrevented) {
                return;
            }
            _this.endCapture();
        });
        /**
         * SAVE事件
         */
        electron_1.ipcMain.on("SCREENSHOTS:".concat(this.winId, ":save"), function (e, buffer, data) { return __awaiter(_this, void 0, void 0, function () {
            var event, time, year, month, date, hours, minutes, seconds, milliseconds, _a, canceled, filePath;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        this.logger("SCREENSHOTS:".concat(this.winId, ":save buffer.length %d, data: %o"), buffer.length, data);
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
                        milliseconds = (0, padStart_1.default)(time.getMilliseconds(), 3, '0');
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
                            this.emit('afterSave', new event_1.default(), buffer, data, false); // isSaved = false
                            return [2 /*return*/];
                        }
                        this.$win.setAlwaysOnTop(true);
                        if (canceled || !filePath) {
                            this.$view.webContents.send("SCREENSHOTS:".concat(this.winId, ":afterSave"));
                            this.emit('afterSave', new event_1.default(), buffer, data, false); // isSaved = false
                            return [2 /*return*/];
                        }
                        return [4 /*yield*/, fs_extra_1.default.writeFile(filePath, buffer)];
                    case 2:
                        _b.sent();
                        this.$view.webContents.send("SCREENSHOTS:".concat(this.winId, ":afterSave"));
                        this.emit('afterSave', new event_1.default(), buffer, data, true); // isSaved = true
                        this.endCapture();
                        return [2 /*return*/];
                }
            });
        }); });
        /**
         * SELECTED事件
         */
        electron_1.ipcMain.on("SCREENSHOTS:".concat(this.winId, ":selected"), function () {
            _this.logger("SCREENSHOTS:".concat(_this.winId, ":selected "));
            _this.emit('selected');
        });
    };
    return Window;
}(events_1.default));
exports.default = Window;
