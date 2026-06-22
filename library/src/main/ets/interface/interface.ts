// NativeContext 类型定义，供 ArkTS 调用 so 库时做类型提示
export class JSBind {
  bindFunction: (name: string, func: Function) => number;
}

export interface NativeContext {
  JSBind: JSBind;
}
