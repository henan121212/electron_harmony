import { Display } from './getDisplay';
import { Logger } from '../types';
export declare const isHarmonyOS: boolean;
/**
 * 区域截图（用户交互选区）
 * 走 screenshot.pick()，返回截取的图片 base64
 */
export declare function areaCapture(logger: Logger): Promise<string | null>;
/**
 * 全屏截图
 * 走 screenshot.capture({displayId})，返回全屏图片 base64
 */
export declare function captureScreen(display: Display, logger: Logger): Promise<string | null>;
