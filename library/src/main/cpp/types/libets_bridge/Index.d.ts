import type { NativeContext } from '../../../ets/interface/interface'

export const getNativeContext: () => NativeContext;

// AkiPickInfo：AKI 绑定类，C++ 侧通过 JSBIND_CLASS(AkiPickInfo) 注册
// buffer: 图片数据的 ArrayBuffer
// rect:   截屏区域，Map<string, number> 对应 C++ std::map<std::string, int>
export class AkiPickInfo {
  buffer: ArrayBuffer;
  rect: Map<string, number>;
  constructor(buffer?: ArrayBuffer, rect?: Map<string, number>);
}

// 截图结果：addon -> Electron JS
export interface CPickInfo {
  buffer: Uint8Array;
  length: number;
  rect: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

// screenCapture addon 导出的方法
export interface ScreenCaptureAddon {
  screenCapture(mode: string): Promise<CPickInfo>;
}
