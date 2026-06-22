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
    tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'electron_white.png')));
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: true
        }
    });
    mainWindow.setWindowButtonVisibility(true);
    mainWindow.loadFile('index.html');
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
        });
        
        screenshotsInstance.on('cancel', () => {
            console.log('[main] screenshots cancel');
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.show();
            }
        });
        
        screenshotsInstance.on('save', (e, buffer, bounds) => {
            console.log('[main] screenshots save, bounds:', bounds);
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
