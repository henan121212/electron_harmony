/// <reference types="node" />
import Events from 'events';
import { ScreenshotsOpts } from './types';
export default class Screenshots extends Events {
    private logger;
    private store;
    private opts?;
    private timer;
    private currentDisplayId;
    private windowCreateFlag;
    private selected;
    constructor(opts?: ScreenshotsOpts);
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
