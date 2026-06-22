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
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
var electron_1 = require("electron");
var events_1 = __importDefault(require("events"));
var window_1 = __importDefault(require("./window"));
var Screenshots = /** @class */ (function (_super) {
    __extends(Screenshots, _super);
    function Screenshots(opts) {
        var _this = _super.call(this) || this;
        _this.store = new Map();
        _this.timer = undefined;
        _this.currentDisplayId = undefined;
        _this.windowCreateFlag = false;
        _this.selected = false;
        _this.startCapture = function () {
            console.log('[Screenshots] startCapture');
            _this.getDisplayWithMousePoint();
            var displays = electron_1.screen.getAllDisplays();
            var windows = displays.map(function (monitor) {
                var display = {
                    id: monitor.id,
                    x: Math.floor(monitor.bounds.x),
                    y: Math.floor(monitor.bounds.y),
                    width: Math.floor(monitor.bounds.width),
                    height: Math.floor(monitor.bounds.height),
                    scaleFactor: monitor.scaleFactor,
                };
                var win = _this.store.get(monitor.id);
                if (!win) {
                    win = new window_1.default(__assign(__assign({}, _this.opts), { display: display }));
                }
                else {
                    win.updateDisplay(display);
                }
                win.once('ok', _this.onOk);
                win.once('cancel', _this.onCancel);
                win.once('save', _this.onSave);
                win.once('afterSave', _this.onAfterSave);
                win.once('windowCreated', _this.onWindowCreated);
                win.once('windowClosed', _this.onWindowClosed);
                win.once('selected', _this.onSelected);
                _this.store.set(monitor.id, win);
                return win;
            });
            windows.forEach(function (win) {
                win.startCapture();
            });
        };
        _this.endCapture = function () {
            console.log('[Screenshots] endCapture');
            _this.store.forEach(function (win) {
                win.endCapture();
            });
            _this.reset();
        };
        _this.reset = function () {
            clearTimeout(_this.timer);
            _this.currentDisplayId = undefined;
            _this.windowCreateFlag = false;
            _this.selected = false;
        };
        _this.getDisplayWithMousePoint = function () {
            var cursorPosition = electron_1.screen.getCursorScreenPoint();
            var display = electron_1.screen.getDisplayNearestPoint(cursorPosition);
            if (_this.selected) {
                return;
            }
            if (_this.currentDisplayId !== display.id) {
                _this.currentDisplayId = display.id;
                _this.updateWindowEnabled();
            }
            _this.timer = setTimeout(_this.getDisplayWithMousePoint, 75);
        };
        _this.updateWindowEnabled = function () {
            var _a = _this.getDisplayInfo(), currentWindow = _a.currentWindow, extraWindows = _a.extraWindows;
            currentWindow === null || currentWindow === void 0 ? void 0 : currentWindow.sendEvent('setEnabled', true);
            extraWindows.forEach(function (win) {
                win.sendEvent('setEnabled', false);
            });
        };
        _this.notifyExtraWindowExit = function () {
            var _a = _this.getDisplayInfo(), currentWindow = _a.currentWindow, extraWindows = _a.extraWindows;
            setTimeout(function () {
                currentWindow === null || currentWindow === void 0 ? void 0 : currentWindow.endCapture();
                extraWindows.forEach(function (win) { return win.endCapture(); });
            }, 75);
        };
        _this.onOk = function (e, buffer, bounds) {
            _this.emit('ok', e, buffer, bounds);
            _this.notifyExtraWindowExit();
            _this.reset();
        };
        _this.onCancel = function () {
            _this.emit('cancel');
            _this.notifyExtraWindowExit();
            _this.reset();
        };
        _this.onSave = function (e, buffer, bounds) {
            _this.emit('save', e, buffer, bounds);
            _this.reset();
        };
        _this.onAfterSave = function (e, buffer, bounds, isSaved) {
            _this.emit('afterSave', e, buffer, bounds, isSaved);
            _this.notifyExtraWindowExit();
            _this.reset();
        };
        _this.onWindowCreated = function ($win) {
            if (_this.windowCreateFlag) {
                return;
            }
            _this.emit('windowCreated', $win);
            _this.windowCreateFlag = true;
        };
        _this.onWindowClosed = function ($win) {
            _this.emit('windowClosed', $win);
        };
        _this.onSelected = function () {
            _this.selected = true;
            _this.updateWindowEnabled();
        };
        _this.opts = opts;
        console.log('[Screenshots] constructor');
        return _this;
    }
    Screenshots.prototype.getDisplayInfo = function () {
        var _this = this;
        var windows = [];
        var currentWindow;
        this.store.forEach(function (win, displayId) {
            if (displayId === _this.currentDisplayId) {
                currentWindow = win;
            }
            else {
                windows.push(win);
            }
        });
        return {
            currentWindow: currentWindow,
            extraWindows: windows,
        };
    };
    return Screenshots;
}(events_1.default));
exports.default = Screenshots;
