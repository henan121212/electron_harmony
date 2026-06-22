/// <reference types="node" />
import Events from 'events';
import { Display } from './helper/getDisplay';
export default class Screenshots extends Events {
    private store;
    private opts?;
    private timer;
    private currentDisplayId;
    private windowCreateFlag;
    private selected;
    constructor(opts?: {
        display?: Display;
        singleWindow?: boolean;
        lang?: any;
        editorHtmlPath?: string;
    });
    startCapture: () => void;
    endCapture: () => void;
    private reset;
    private getDisplayInfo;
    private getDisplayWithMousePoint;
    private updateWindowEnabled;
    private notifyExtraWindowExit;
    private onOk;
    private onCancel;
    private onSave;
    private onAfterSave;
    private onWindowCreated;
    private onWindowClosed;
    private onSelected;
}
