/// <reference types="node" />
import { BrowserView, BrowserWindow } from 'electron';
import Events from 'events';
import { Display } from './helper/getDisplay';
export default class Window extends Events {
    private display?;
    $win: BrowserWindow | null;
    $view: BrowserView;
    private singleWindow;
    private get winId();
    private isReady;
    constructor(opts?: {
        display?: Display;
        singleWindow?: boolean;
        lang?: any;
        editorHtmlPath?: string;
    });
    updateDisplay(display: Display): void;
    startCapture(): Promise<void>;
    endCapture(): Promise<void>;
    setLang(lang: any): Promise<void>;
    sendEvent(channel: string, payload: any): void;
    private reset;
    private createWindow;
    private capture;
    private listenIpc;
}
