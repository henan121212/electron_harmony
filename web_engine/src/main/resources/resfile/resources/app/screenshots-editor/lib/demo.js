"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
var electron_1 = require("electron");
var _1 = __importDefault(require("."));
electron_1.app.whenReady().then(function () {
    var screenshots = new _1.default({
        lang: {
            operation_rectangle_title: '矩形2323',
        },
        // singleWindow: true,
    });
    electron_1.globalShortcut.register('option+x', function () {
        screenshots.startCapture();
    });
    screenshots.on('windowCreated', function () {
        electron_1.globalShortcut.register('esc', function () {
            screenshots.endCapture();
        });
    });
    // 防止不能关闭截图界面
    electron_1.globalShortcut.register('ctrl+shift+q', function () {
        electron_1.app.quit();
    });
    // 点击确定按钮回调事件
    screenshots.on('ok', function (e, buffer, bounds) {
        console.log('capture', bounds);
    });
    // 点击取消按钮回调事件
    screenshots.on('cancel', function () {
        electron_1.globalShortcut.unregister('esc');
        console.log('capture', 'cancel1');
    });
    // 点击保存按钮回调事件
    screenshots.on('save', function (e, buffer, bounds) {
        console.log('capture', bounds);
    });
    var mainWin = new electron_1.BrowserWindow({
        show: true,
    });
    mainWin.removeMenu();
    mainWin.loadURL('https://www.qingtui.com');
});
electron_1.app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
