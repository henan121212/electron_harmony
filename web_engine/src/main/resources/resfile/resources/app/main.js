const { app, BrowserWindow, Tray, nativeImage, Menu, ipcMain, globalShortcut, desktopCapturer } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');

// ===== 初始化 @electron/remote =====
const remoteMain = require('@electron/remote/main');
remoteMain.initialize();
console.log('[main.js] @electron/remote initialized');

const etsBridge = require('ets_bridge_addon.node');
console.log('[main.js] etsBridge loaded, keys:', Object.keys(etsBridge));

// ===== 加载 electron-screenshots 库 =====
const Screenshots = require('./screenshots-editor/lib/index.js').default;
console.log('[main.js] Screenshots loaded:', typeof Screenshots);

let screenshotsInstance = null;

// ===== better-sqlite3 加载 =====
let Database;
try {
    Database = require('better-sqlite3');
    console.log('[main.js] better-sqlite3 npm wrapper loaded');
} catch (e1) {
    console.log('[main.js] npm wrapper FAILED, try absolute path:', e1 && e1.message);
    try {
        Database = require('/data/storage/el1/bundle/libs/arm64/better_sqlite3');
        console.log('[main.js] absolute path loaded');
    } catch (e2) {
        console.log('[main.js] absolute path FAILED:', e2 && e2.message);
    }
}

// 测试 better-sqlite3（失败不阻断主流程）
const dbPath = path.join(os.tmpdir(), 'test_better_sqlite3.db');
console.log('[main.js] dbPath:', dbPath);
if (Database) {
    try {
        const db = new Database(dbPath);
        console.log('[main.js] db opened OK');
        db.exec('CREATE TABLE IF NOT EXISTS t (id INTEGER PRIMARY KEY, name TEXT)');
        console.log('[main.js] CREATE TABLE OK');
        const insert = db.prepare('INSERT INTO t (name) VALUES (?)');
        const info = insert.run('hello-harmonyos');
        console.log('[main.js] INSERT OK, lastInsertRowid:', info && info.lastInsertRowid, 'changes:', info && info.changes);
        const rows = db.prepare('SELECT * FROM t').all();
        console.log('[main.js] SELECT OK, rows:', JSON.stringify(rows));
        db.close();
        console.log('[main.js] db closed OK');
        try { fs.unlinkSync(dbPath); } catch (e) {}
        console.log('[main.js] cleanup OK');
    } catch (e) {
        console.log('[main.js] sqlite test FAILED:', e && e.stack ? e.stack : e);
    }
} else {
    console.log('[main.js] better-sqlite3 NOT loaded, skip test');
}

let mainWindow, tray;
let editorWindow = null; // 截图编辑窗口

function createWindow() {
    console.log('[main] createWindow called');
    tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'electron_white.png')));
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true
        }
    });
    console.log('[main] mainWindow created, id:', mainWindow.id, 'isDestroyed:', mainWindow.isDestroyed());
    mainWindow.setWindowButtonVisibility(true);
    mainWindow.loadFile('index.html');
    
    // 追踪 mainWindow 销毁事件
    mainWindow.on('closed', () => {
        console.log('[main] mainWindow CLOSED event fired!');
        mainWindow = null;
    });
}

// ===== 截图编辑窗口 =====
function createEditorWindow(displayInfo, imageData) {
    console.log('[main] createEditorWindow, display:', displayInfo, 'imageLen:', imageData ? imageData.length : 0);

    if (editorWindow && !editorWindow.isDestroyed()) {
        editorWindow.close();
    }

    // 准备数据
    const imageUrl = 'data:image/png;base64,' + imageData;

    // 存储数据供 preload 获取
    pendingCaptureData = {
        imageUrl: imageUrl,
        display: displayInfo
    };
    console.log('[main] stored pendingCaptureData, imageUrl len:', imageUrl.length);

    const editorWin = new BrowserWindow({
        width: displayInfo.width || 1920,
        height: displayInfo.height || 1080,
        x: displayInfo.x || 0,
        y: displayInfo.y || 0,
        frame: false,
        transparent: true,
        resizable: false,
        movable: false,
        minimizable: false,
        maximizable: false,
        focusable: true,
        skipTaskbar: true,
        alwaysOnTop: true,
        fullscreenable: false,
        backgroundColor: '#00000000',
        show: false,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true,
            preload: path.join(__dirname, 'screenshots-editor', 'preload.js')
        }
    });

    // 加载 HTML 文件
    editorWin.loadFile(path.join(__dirname, 'screenshots-editor', 'electron.html'));

    editorWin.once('ready-to-show', () => {
        editorWin.show();
    });

    editorWindow = editorWin;
    return editorWin;
}

// ===== 获取 BrowserView webContents ID =====
ipcMain.handle('editor:getCurrentWinId', async (event) => {
    // 返回当前 webContents 的 ID
    return event.sender.id;
});

// ===== screenshots:get-win-id (由 preload.js 使用) =====
ipcMain.handle('screenshots:get-win-id', async (event) => {
    console.log('[main] screenshots:get-win-id, sender id:', event.sender.id);
    return event.sender.id;
});

// ===== 获取截图图片数据 =====
let pendingCaptureData = null; // 临时存储截图数据

ipcMain.handle('editor:getImageData', async (event) => {
    console.log('[main] editor:getImageData, pending:', pendingCaptureData ? 'yes' : 'no');
    const data = pendingCaptureData;
    pendingCaptureData = null; // 清除
    return data;
});

app.whenReady().then(() => {
    // 初始化截图库
    if (Screenshots) {
        screenshotsInstance = new Screenshots({
            logger: (...args) => console.log('[screenshots]', ...args),
            editorHtmlPath: path.join(__dirname, 'screenshots-editor', 'electron.html')
        });
        
        screenshotsInstance.on('ok', (e, buffer, bounds) => {
            console.log('[main] screenshots ok, bounds:', bounds);
            // 恢复主窗口
            if (mainWindow && !mainWindow.isDestroyed()) {
                console.log('[main] screenshots ok - showing mainWindow');
                mainWindow.show();
                mainWindow.focus();
            } else {
                console.log('[main] screenshots ok - mainWindow is destroyed or null!');
            }
        });
        
        screenshotsInstance.on('cancel', () => {
            console.log('[main] screenshots cancel');
            if (mainWindow && !mainWindow.isDestroyed()) {
                console.log('[main] screenshots cancel - showing mainWindow');
                mainWindow.show();
                mainWindow.focus();
            } else {
                console.log('[main] screenshots cancel - mainWindow is destroyed or null!');
            }
        });
        
        screenshotsInstance.on('save', (e, buffer, bounds) => {
            console.log('[main] screenshots save, bounds:', bounds);
            // 恢复主窗口
            if (mainWindow && !mainWindow.isDestroyed()) {
                console.log('[main] screenshots save - showing mainWindow');
                mainWindow.show();
                mainWindow.focus();
            }
        });
        
        screenshotsInstance.on('windowCreated', () => {
            console.log('[main] screenshots windowCreated');
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.hide();
            }
        });
        
        console.log('[main] screenshotsInstance initialized');
    }
    
    createWindow();
});

// ===== 截屏快捷键（仅截全屏+编辑）=====
app.whenReady().then(() => {
    const okF = globalShortcut.register('CommandOrControl+Shift+F', () => {
        console.log('[main] shortcut Ctrl+Shift+F -> capture with editor');
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('trigger-capture', 'editor');
        }
    });
    console.log('[main] globalShortcut register capture+editor=' + okF);
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

// ===== 全屏截图（主进程侧隐藏窗口）=====
ipcMain.handle('capture:full-with-hide', async () => {
    console.log('[main] capture:full-with-hide');
    if (!mainWindow || mainWindow.isDestroyed()) {
        return { ok: false, reason: 'no main window' };
    }
    try {
        mainWindow.hide();
        await new Promise(r => setTimeout(r, 250));
        return { ok: true };
    } catch (e) {
        console.error('[main] capture:full-with-hide ERR: ' + e);
        try { mainWindow.show(); } catch (_) {}
        return { ok: false, reason: String(e) };
    }
});

ipcMain.handle('capture:restore-window', async () => {
    console.log('[main] capture:restore-window');
    if (!mainWindow || mainWindow.isDestroyed()) {
        return { ok: false };
    }
    try {
        if (!mainWindow.isVisible()) mainWindow.show();
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.focus();
        return { ok: true };
    } catch (e) {
        console.error('[main] capture:restore-window ERR: ' + e);
        return { ok: false, reason: String(e) };
    }
});

// ===== 全屏预览窗口 =====
ipcMain.handle('capture:show-fullscreen', async (event, payload) => {
    console.log('[main] capture:show-fullscreen');
    try {
        const { screen } = require('electron');
        const display = screen.getPrimaryDisplay();
        const work = display.workArea;

        const dataUrl = 'data:image/jpeg;base64,' + (payload && payload.data ? payload.data : '');
        const previewWin = new BrowserWindow({
            x: work.x,
            y: work.y,
            width: work.width,
            height: work.height,
            frame: false,
            fullscreen: false,
            alwaysOnTop: true,
            skipTaskbar: true,
            resizable: false,
            movable: false,
            minimizable: false,
            maximizable: false,
            hasShadow: false,
            backgroundColor: '#000000',
            show: false,
            webPreferences: { contextIsolation: false, nodeIntegration: true }
        });
        previewWin.setMenuBarVisibility(false);
        previewWin.setWindowButtonVisibility(false);
        previewWin.loadFile('preview.html', { hash: encodeURIComponent(dataUrl) });
        previewWin.once('ready-to-show', () => {
            previewWin.show();
            previewWin.focus();
        });
        return { ok: true };
    } catch (e) {
        console.error('[main] capture:show-fullscreen ERR: ' + e);
        return { ok: false, reason: String(e) };
    }
});

ipcMain.handle('preview:close', async (event) => {
    try {
        const win = BrowserWindow.fromWebContents(event.sender);
        if (win && !win.isDestroyed()) win.close();
        return { ok: true };
    } catch (e) {
        return { ok: false, reason: String(e) };
    }
});

// ===== 截图 + 编辑窗口 =====
// 直接使用 electron-screenshots 插件的 startCapture 方法
// 该插件已集成鸿蒙原生截图
ipcMain.handle('capture:withEditor', async (event, payload) => {
    console.log('[main] capture:withEditor');
    if (!mainWindow || mainWindow.isDestroyed()) {
        return { ok: false, reason: 'no main window' };
    }

    if (!screenshotsInstance) {
        return { ok: false, reason: 'screenshots not initialized' };
    }

    try {
        // 隐藏主窗口
        mainWindow.hide();
        await new Promise(r => setTimeout(r, 250));

        // 调用 electron-screenshots 的 startCapture
        // 它会自动：1. 调用鸿蒙原生截图 2. 创建编辑窗口 3. 发送 capture 事件
        console.log('[main] calling screenshotsInstance.startCapture()');
        await screenshotsInstance.startCapture();
        console.log('[main] startCapture completed');

        return { ok: true };
    } catch (e) {
        console.error('[main] capture:withEditor ERR:', e);
        try { mainWindow.show(); } catch (_) {}
        return { ok: false, reason: String(e) };
    }
});

// ===== 测试多屏全屏窗口 - 鸿蒙获取屏幕信息 =====
// 调用鸿蒙 getAllDisplaysInfo API，在每个屏幕上打开一个全屏窗口
ipcMain.handle('capture:test-multi-display', async (event, payload) => {
    console.log('[main] capture:test-multi-display (HarmonyOS)');
    try {
        // 通过 etsBridge 获取所有屏幕信息（鸿蒙API）
        const result = await etsBridge.callAsync('getAllDisplaysInfo', '{}');
        console.log('[main] HarmonyOS getAllDisplaysInfo result:', result);
        
        let parsed;
        try {
            parsed = JSON.parse(result);
        } catch (e) {
            console.error('[main] parse getAllDisplaysInfo result failed:', e);
            return { ok: false, reason: 'invalid json from getAllDisplaysInfo' };
        }
        
        // 支持两种返回格式：1) {code: 0, data: "[{...}]"}  2) [{...}]
        let displays;
        if (Array.isArray(parsed)) {
            displays = parsed;
        } else if (parsed.code === 0 && parsed.data) {
            try {
                displays = JSON.parse(parsed.data);
            } catch (e) {
                console.error('[main] parse displays data failed:', e);
                return { ok: false, reason: 'invalid displays json' };
            }
        } else {
            return { ok: false, reason: 'getAllDisplaysInfo failed: ' + JSON.stringify(parsed) };
        }
        
        console.log('[main] HarmonyOS displays count:', displays.length);
        console.log('[main] HarmonyOS displays (physical):', JSON.stringify(displays));
        
        // HarmonyOS getAllDisplaysInfo 返回物理像素，BrowserWindow 需要逻辑像素
        // 需要用 densityPixels (scale) 转换
        const logicalDisplays = displays.map(d => {
            const scale = d.scale || 1;
            return {
                id: d.id,
                x: Math.round(d.x / scale),
                y: Math.round(d.y / scale),
                width: Math.round(d.width / scale),
                height: Math.round(d.height / scale),
                scale: scale,
                scaleFactor: scale,
                internal: d.internal,
                label: d.label
            };
        });
        
        console.log('[main] HarmonyOS displays (logical):', JSON.stringify(logicalDisplays));
        
        return createMultiDisplayWindows(logicalDisplays, 'HarmonyOS');
    } catch (e) {
        console.error('[main] capture:test-multi-display ERR:', e);
        return { ok: false, reason: String(e) };
    }
});

// ===== 测试多屏全屏窗口 - Electron获取屏幕信息 =====
// 调用 Electron screen.getAllDisplays() API，在每个屏幕上打开一个全屏窗口
ipcMain.handle('capture:test-multi-display-electron', async (event, payload) => {
    console.log('[main] capture:test-multi-display-electron (Electron)');
    try {
        const { screen } = require('electron');
        const electronDisplays = screen.getAllDisplays();
        
        console.log('[main] Electron screen.getAllDisplays() count:', electronDisplays.length);
        console.log('[main] Electron displays:', JSON.stringify(electronDisplays));
        
        // BrowserWindow 在 HarmonyOS 上使用逻辑像素，不做物理转换
        const displays = electronDisplays.map((d, index) => {
            const scale = d.scaleFactor || 1;
            const logicalWidth = Math.round(d.bounds?.width || d.size?.width || d.width || 0);
            const logicalHeight = Math.round(d.bounds?.height || d.size?.height || d.height || 0);

            console.log('[main] Electron display', index, ': logical=', logicalWidth, 'x', logicalHeight,
                        ', scale=', scale);

            return {
                id: d.id,
                x: Math.floor(d.bounds?.x ?? d.x ?? 0),
                y: Math.floor(d.bounds?.y ?? d.y ?? 0),
                width: logicalWidth,
                height: logicalHeight,
                scale,
                scaleFactor: scale,
                internal: d.internal,
                label: d.label
            };
        });
        
        console.log('[main] Converted physical displays:', JSON.stringify(displays));
        
        return createMultiDisplayWindows(displays, 'Electron');
    } catch (e) {
        console.error('[main] capture:test-multi-display-electron ERR:', e);
        return { ok: false, reason: String(e) };
    }
});

// ===== 通用：创建多屏窗口 =====
// displays: 屏幕信息数组
// source: 'HarmonyOS' | 'Electron' - 用于日志标识
function createMultiDisplayWindows(displays, source) {
    console.log('[main] Creating', displays.length, 'windows from', source);
    
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'];
    
    for (let i = 0; i < displays.length; i++) {
        const display = displays[i];
        const bgColor = colors[i % colors.length];
        
        console.log('[main] Creating window', i, 'on display:', JSON.stringify(display));
        
        // 构建显示信息
        const htmlContent = `
            <html>
            <head>
                <style>
                    * { box-sizing: border-box; margin: 0; padding: 0; }
                    html, body {
                        width: 100%;
                        height: 100%;
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        background: #1a1a2e;
                    }
                    img {
                        max-width: 100%;
                        max-height: 100%;
                        object-fit: contain;
                    }
                    .debug {
                        position: fixed;
                        top: 10px;
                        left: 10px;
                        background: rgba(0,0,0,0.7);
                        color: white;
                        padding: 10px;
                        font-size: 14px;
                        font-family: monospace;
                        border-radius: 5px;
                    }
                </style>
            </head>
            <body>
                <img src="https://fuss10.elemecdn.com/a/3f/3302e58f9a181d2509f3dc0fa68b0jpeg.jpeg" alt="Test Image" />
                <div class="debug">
                    Display ${display.id}<br/>
                    Size: ${display.width}x${display.height}<br/>
                    Position: (${display.x}, ${display.y})
                </div>
            </body>
            </html>
        `;
        
        // 对于扩展屏 (x > 0)，需要使用 setPosition 到正确位置
        // 而不是依赖 BrowserWindow 的 x 参数（会被误解为相对于屏幕本地的坐标）
        const winOpts = {
            x: 0,  // 先设为 0，后面用 setPosition 设置正确位置
            y: 0,
            width: display.width,
            height: display.height,
            frame: false,
            transparent: false,
            fullscreen: false,  // 不用 fullscreen，后面手动设置大小和位置
            fullscreenable: false,
            alwaysOnTop: false,
            skipTaskbar: false,
            resizable: false,
            movable: false,
            minimizable: true,
            maximizable: false,
            focusable: true,
            backgroundColor: bgColor,
            show: true,
            title: 'Multi-Display Test - Screen ' + (i + 1) + ' [' + source + ']',
            webPreferences: {
                contextIsolation: false,
                nodeIntegration: true
            }
        };
        
        // 如果有 displayId 或 display_id，添加这个选项（鸿蒙适配）
        if (display.id !== undefined) {
            winOpts.displayId = display.id;
        }
        
        console.log('[main] Creating window opts:', JSON.stringify({
            x: winOpts.x,
            y: winOpts.y,
            width: winOpts.width,
            height: winOpts.height,
            displayId: winOpts.displayId,
            targetX: display.x,
            scale: display.scale
        }));
        
        const testWin = new BrowserWindow(winOpts);
        
        testWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(htmlContent));
        
        // 等待窗口准备好后再设置大小和位置
        testWin.once('ready-to-show', () => {
            console.log('[main] Window ready-to-show, setting bounds for display', display.id);
            
            // 设置窗口大小为全屏
            testWin.setSize(display.width, display.height);
            
            // 当设置了 displayId 时，坐标是屏幕本地坐标，统一使用 (0, 0)
            // 这样窗口会正好填满目标屏幕
            testWin.setPosition(0, 0);
        });
        
        console.log('[main] Window created for display', display.id, 'from', source, 'at x=' + display.x + ' y=' + display.y);
    }
    
    return { ok: true, count: displays.length, source: source };
}

// ===== 编辑窗口 IPC 处理器 =====
// 编辑窗口使用 BrowserView 模式，通过 SCREENSHOTS:{id}:* 事件通信

ipcMain.on('editor:ok', (event, arrayBuffer, data) => {
    console.log('[main] editor:ok, bufferLen:', arrayBuffer ? arrayBuffer.length : 0, 'data:', JSON.stringify(data));
    
    // 复制到剪贴板
    const { clipboard, nativeImage } = require('electron');
    if (arrayBuffer && arrayBuffer.length > 0) {
        const img = nativeImage.createFromBuffer(Buffer.from(arrayBuffer));
        clipboard.writeImage(img);
        console.log('[main] editor:ok, image copied to clipboard');
    }
    
    // 关闭编辑窗口并显示主窗口
    if (editorWindow && !editorWindow.isDestroyed()) {
        editorWindow.close();
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
    }
});

ipcMain.on('editor:cancel', (event) => {
    console.log('[main] editor:cancel');
    
    if (editorWindow && !editorWindow.isDestroyed()) {
        editorWindow.close();
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
    }
});

ipcMain.on('editor:save', (event, arrayBuffer, data) => {
    console.log('[main] editor:save, bufferLen:', arrayBuffer ? arrayBuffer.length : 0, 'data:', JSON.stringify(data));
    
    // 可以在此实现保存对话框
    // 这里只是演示，实际可以根据需要实现
});

// 编辑窗口通过 BrowserView 的 webContents 发送事件
// 我们需要在编辑窗口准备好后监听这些事件
let editorWinId = null;

// 监听编辑窗口的准备完成事件
ipcMain.on('SCREENSHOTS:ready', (event, winId) => {
    console.log('[main] SCREENSHOTS:ready received, winId:', winId);
    editorWinId = winId;
});

// 监听编辑窗口的 ok 事件 (截图确定，复制到剪贴板)
ipcMain.on('SCREENSHOTS:ok', (event, arrayBuffer, data) => {
    console.log('[main] SCREENSHOTS:ok, bufferLen:', arrayBuffer ? arrayBuffer.length : 0);
    
    const { clipboard, nativeImage } = require('electron');
    if (arrayBuffer && arrayBuffer.length > 0) {
        const buffer = Buffer.from(arrayBuffer);
        const img = nativeImage.createFromBuffer(buffer);
        clipboard.writeImage(img);
        console.log('[main] SCREENSHOTS:ok, image copied to clipboard');
    }
    
    if (editorWindow && !editorWindow.isDestroyed()) {
        editorWindow.close();
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
    }
});

// 监听编辑窗口的 cancel 事件
ipcMain.on('SCREENSHOTS:cancel', (event) => {
    console.log('[main] SCREENSHOTS:cancel received');
    
    if (editorWindow && !editorWindow.isDestroyed()) {
        editorWindow.close();
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
        mainWindow.focus();
    }
});

// 监听编辑窗口的 save 事件
ipcMain.on('SCREENSHOTS:save', (event, arrayBuffer, data) => {
    console.log('[main] SCREENSHOTS:save, bufferLen:', arrayBuffer ? arrayBuffer.length : 0, 'data:', JSON.stringify(data));
    // TODO: 实现保存对话框
});

// ===== ets bridge =====
ipcMain.handle('ets:callSync', async (event, methodName, paramJson) => {
    console.log('[main] ets:callSync method=' + methodName + ' param=' + paramJson);
    try {
        var result = etsBridge.callSync(methodName, paramJson || '{}');
        console.log('[main] ets:callSync result=' + result);
        return result;
    } catch(e) {
        console.error('[main] ets:callSync ERR: ' + e);
        throw e;
    }
});

ipcMain.handle('ets:callAsync', async (event, methodName, paramJson) => {
    console.log('[main] ets:callAsync method=' + methodName + ' param=' + paramJson);
    try {
        var result = await etsBridge.callAsync(methodName, paramJson || '{}');
        console.log('[main] ets:callAsync result=' + result);
        return result;
    } catch(e) {
        console.error('[main] ets:callAsync ERR: ' + e);
        throw e;
    }
});

ipcMain.handle('ets:getODID', async () => {
    try { return etsBridge.getODID(); } catch(e) { console.error(e); throw e; }
});

ipcMain.handle('ets:setODIDAttr', async (event, id) => {
    try { return etsBridge.setODIDAttr(id); } catch(e) { console.error(e); throw e; }
});

// ===== sqlite3 IPC =====
ipcMain.handle('sqlite3:exec', async (event, sql) => {
    try {
        if (!Database) throw new Error('Database not initialized');
        Database.exec(sql);
        return { ok: true };
    } catch(e) {
        console.error('[main] sqlite3:exec ERR:', e);
        return { ok: false, error: e.message };
    }
});

ipcMain.handle('sqlite3:run', async (event, sql, params) => {
    try {
        if (!Database) throw new Error('Database not initialized');
        const info = Database.prepare(sql).run(...(params || []));
        return { ok: true, lastInsertRowid: info.lastInsertRowid, changes: info.changes };
    } catch(e) {
        console.error('[main] sqlite3:run ERR:', e);
        return { ok: false, error: e.message };
    }
});

ipcMain.handle('sqlite3:all', async (event, sql, params) => {
    try {
        if (!Database) throw new Error('Database not initialized');
        const rows = Database.prepare(sql).all(...(params || []));
        return { ok: true, rows };
    } catch(e) {
        console.error('[main] sqlite3:all ERR:', e);
        return { ok: false, error: e.message };
    }
});

ipcMain.handle('sqlite3:get', async (event, sql, params) => {
    try {
        if (!Database) throw new Error('Database not initialized');
        const row = Database.prepare(sql).get(...(params || []));
        return { ok: true, row };
    } catch(e) {
        console.error('[main] sqlite3:get ERR:', e);
        return { ok: false, error: e.message };
    }
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
