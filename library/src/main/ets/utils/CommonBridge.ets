/*
 * Copyright (c) Huawei Technologies Co., Ltd. 2025-2025. All rights reserved.
 *
 * 通用 ETS 桥接层
 * 职责：
 *   1. 接收 Electron 通过 AKI 传来的调用
 *   2. 路由到具体的业务实现
 *   3. 返回统一格式 {"code":0,"data":"...","msg":"success"}
 */

import etsBridgeAdapter from 'libets_bridge_adapter.so';
import { NativeContext } from '../interface/interface';
import { BusinessError } from '@ohos.base';
import { display } from '@kit.ArkUI';
import { hilog } from '@kit.PerformanceAnalysisKit';

type SyncMethodHandler = (paramJson: string) => string;
const syncMethods: Map<string, SyncMethodHandler> = new Map();

type AsyncMethodHandler = (paramJson: string, callback: (ret: boolean, data: string) => void) => void;
const asyncMethods: Map<string, AsyncMethodHandler> = new Map();

function getAllDisplaysInfoHandler(paramJson: string, callback: (ret: boolean, data: string) => void): void {
  hilog.info(0x0000, '[CommonBridge]', 'getAllDisplaysInfoHandler called');
  try {
    display.getAllDisplays((err: BusinessError, data: Array<display.Display>) => {
      if (err.code !== 0) {
        let errMsg = err.message ?? JSON.stringify(err);
        hilog.error(0x0000, '[CommonBridge]', 'getAllDisplaysInfo failed: code=%{public}d, msg=%{public}s', err.code, errMsg);
        callback(false, JSON.stringify({ code: err.code, data: '[]' }));
        return;
      }
      let result: Array<Record<string, number>> = data.map(d => {
        let item: Record<string, number> = {
          'id': d.id,
          'x': d.x ?? 0,
          'y': d.y ?? 0,
          'width': d.width ?? 0,
          'height': d.height ?? 0,
          'scale': (d as display.Display).densityPixels ?? 1.0
        };
        hilog.info(0x0000, '[CommonBridge]', 'display id=%{public}d, physical=(%{public}d,%{public}d,%{public}d,%{public}d)',
          d.id, d.x ?? 0, d.y ?? 0, d.width ?? 0, d.height ?? 0);
        return item;
      });
      hilog.info(0x0000, '[CommonBridge]', 'getAllDisplaysInfo count=%{public}d', result.length);
      callback(true, JSON.stringify(result));
    });
  } catch (e) {
    hilog.error(0x0000, '[CommonBridge]', 'getAllDisplaysInfo exception: %{public}s', JSON.stringify(e));
    callback(false, JSON.stringify({ code: -1, data: '[]' }));
  }
}

// ============================================================================
// 统一路由
// ============================================================================

function bridgeSync(methodName: string, paramJson: string): string {
  console.log('[CommonBridge] bridgeSync method=' + methodName + ' param=' + paramJson);
  let handler = syncMethods.get(methodName);
  if (handler === undefined) {
    return makeResponse(1, '', 'sync method not found: ' + methodName);
  }
  try {
    let data = handler(paramJson);
    console.log('[CommonBridge] bridgeSync method=' + methodName + ' data=' + data);
    return makeResponse(0, data, 'success');
  } catch (e) {
    let msg: string = (e as BusinessError).message;
    console.error('[CommonBridge] bridgeSync method=' + methodName + ' error=' + msg);
    return makeResponse(1, '', msg);
  }
}

function bridgeAsync(methodName: string, paramJson: string, callback: (ret: boolean, jsonData: string) => void): string {
  console.log('[CommonBridge] bridgeAsync method=' + methodName + ' param=' + paramJson);
  let handler = asyncMethods.get(methodName);
  if (handler === undefined) {
    callback(false, '');
    return makeResponse(1, '', 'async method not found: ' + methodName);
  }

  try {
    handler(paramJson, (ret: boolean, data: string) => {
      console.log('[CommonBridge] bridgeAsync method=' + methodName + ' ret=' + ret + ' dataLen=' + (data?.length ?? 0));
      callback(ret, data ?? '');
    });
  } catch (e) {
    let msg: string = (e as BusinessError).message;
    console.error('[CommonBridge] bridgeAsync method=' + methodName + ' error=' + msg);
    callback(false, '');
    return makeResponse(1, '', msg);
  }
  return makeResponse(0, '', 'success');
}

function makeResponse(code: number, data: string, msg: string): string {
  return JSON.stringify({ code: code, data: data, msg: msg });
}

// ============================================================================
// CommonBridge 类
// ============================================================================
export class CommonBridge {
  private static currentContext: NativeContext;

  static init(): void {
    CommonBridge.currentContext = etsBridgeAdapter.getNativeContext();
  }

  static bind(): void {
    if (CommonBridge.currentContext === undefined) {
      CommonBridge.currentContext = etsBridgeAdapter.getNativeContext();
    }
    CommonBridge.currentContext.JSBind.bindFunction('bridgeSync', bridgeSync);
    CommonBridge.currentContext.JSBind.bindFunction('bridgeAsync', bridgeAsync);
    CommonBridge.registerAsyncMethod('getAllDisplaysInfo', getAllDisplaysInfoHandler);
  }

  static registerAsyncMethod(name: string, handler: AsyncMethodHandler): void {
    asyncMethods.set(name, handler);
  }

  static registerSyncMethod(name: string, handler: SyncMethodHandler): void {
    syncMethods.set(name, handler);
  }

  static getNativeContext(): NativeContext {
    return CommonBridge.currentContext ?? etsBridgeAdapter.getNativeContext();
  }
}
