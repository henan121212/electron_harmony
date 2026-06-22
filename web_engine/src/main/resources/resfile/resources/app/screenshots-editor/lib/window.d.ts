/// <reference types="node" />
import { BrowserView, BrowserWindow } from 'electron';
import Events from 'events';
import { Display } from './helper/getDisplay';
import { ScreenshotsOpts, Lang } from './types';
export default class Window extends Events {
    private display?;
    $win: BrowserWindow | null;
    $view: BrowserView;
    private logger;
    private singleWindow;
    private get winId();
    private isReady;
    constructor(opts?: ScreenshotsOpts);
    updateDisplay(display: Display): void;
    /**
     * 开始截图
     */
    startCapture(): Promise<void>;
    /**
     * 结束截图
     */
    endCapture(): Promise<void>;
    /**
     * 设置语言
     */
    setLang(lang: Partial<Lang>): Promise<void>;
    sendEvent(channel: string, payload: any): void;
    private reset;
    /**
     * 初始化窗口
     */
    private createWindow;
    private capture;
    /**
     * 绑定ipc时间处理
     */
    private listenIpc;
}
