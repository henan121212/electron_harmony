"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
var electron_1 = require("electron");
var map = new Map();
// 异步获取 winId
var winId = null;
var winIdPromise = null;
function getWinId() {
    if (winId !== null) {
        return Promise.resolve(winId);
    }
    if (!winIdPromise) {
        winIdPromise = new Promise(function (resolve) {
            // 立即请求 winId
            electron_1.ipcRenderer.invoke('screenshots:get-win-id').then(function (id) {
                winId = id;
                console.log('[preload] got winId:', id);
                resolve(id);
            });
        });
    }
    return winIdPromise;
}
electron_1.contextBridge.exposeInMainWorld('screenshots', {
    ready: function () {
        console.log('[preload] screenshots.ready called');
        getWinId().then(function (id) {
            console.log("[preload] sending SCREENSHOTS:".concat(id, ":ready"));
            electron_1.ipcRenderer.send("SCREENSHOTS:".concat(id, ":ready"));
        });
    },
    reset: function () {
        console.log('[preload] screenshots.reset');
        getWinId().then(function (id) {
            electron_1.ipcRenderer.send("SCREENSHOTS:".concat(id, ":reset"));
        });
    },
    save: function (arrayBuffer, data) {
        console.log('[preload] screenshots.save');
        getWinId().then(function (id) {
            electron_1.ipcRenderer.send("SCREENSHOTS:".concat(id, ":save"), Buffer.from(arrayBuffer), data);
        });
    },
    cancel: function () {
        console.log('[preload] screenshots.cancel');
        getWinId().then(function (id) {
            electron_1.ipcRenderer.send("SCREENSHOTS:".concat(id, ":cancel"));
        });
    },
    ok: function (arrayBuffer, data) {
        console.log('[preload] screenshots.ok');
        getWinId().then(function (id) {
            electron_1.ipcRenderer.send("SCREENSHOTS:".concat(id, ":ok"), Buffer.from(arrayBuffer), data);
        });
    },
    selected: function () {
        console.log('[preload] screenshots.selected');
        getWinId().then(function (id) {
            electron_1.ipcRenderer.send("SCREENSHOTS:".concat(id, ":selected"));
        });
    },
    on: function (channel, fn) {
        var _a;
        console.log('[preload] screenshots.on:', channel);
        var listener = function (event) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            console.log("[preload] on ".concat(channel, ":"), args.slice(0, 2));
            fn.apply(void 0, args);
        };
        var listeners = (_a = map.get(fn)) !== null && _a !== void 0 ? _a : {};
        listeners[channel] = listener;
        map.set(fn, listeners);
        // 等待 winId 后再注册监听器
        getWinId().then(function (id) {
            console.log("[preload] registering listener for SCREENSHOTS:".concat(id, ":").concat(channel));
            electron_1.ipcRenderer.on("SCREENSHOTS:".concat(id, ":").concat(channel), listener);
        });
    },
    off: function (channel, fn) {
        var _a;
        console.log('[preload] screenshots.off:', channel);
        var listeners = (_a = map.get(fn)) !== null && _a !== void 0 ? _a : {};
        var listener = listeners[channel];
        if (listener && winId !== null) {
            electron_1.ipcRenderer.off("SCREENSHOTS:".concat(winId, ":").concat(channel), listener);
        }
    },
});
console.log('[preload] loaded, requesting winId...');
