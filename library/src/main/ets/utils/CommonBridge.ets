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

type SyncMethodHandler = (paramJson: string) => string;
const syncMethods: Map<string, SyncMethodHandler> = new Map();

type AsyncMethodHandler = (paramJson: string, callback: (ret: boolean, data: string) => void) => void;
const asyncMethods: Map<string, AsyncMethodHandler> = new Map();

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

function bridgeAsync(methodName: string, paramJson: string, callback: (ret: boolean) => void): string {
  console.log('[CommonBridge] bridgeAsync method=' + methodName + ' param=' + paramJson);
  let handler = asyncMethods.get(methodName);
  if (handler === undefined) {
    callback(false);
    return makeResponse(1, '', 'async method not found: ' + methodName);
  }

  try {
    handler(paramJson, (ret: boolean, _data: string) => {
      console.log('[CommonBridge] bridgeAsync method=' + methodName + ' ret=' + ret);
      callback(ret);
    });
  } catch (e) {
    let msg: string = (e as BusinessError).message;
    console.error('[CommonBridge] bridgeAsync method=' + methodName + ' error=' + msg);
    callback(false);
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
  }

  static getNativeContext(): NativeContext {
    return CommonBridge.currentContext ?? etsBridgeAdapter.getNativeContext();
  }
}
