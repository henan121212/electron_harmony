// 新建文件：library/src/main/ets/utils/JsBindingTest.ets
import screenAdapter from 'libets_bridge_adapter.so';
import { NativeContext } from '../interface/interface';
import { display, screenshot } from '@kit.ArkUI';
import { image } from '@kit.ImageKit';
import { hilog } from '@kit.PerformanceAnalysisKit';
import { BusinessError } from '@ohos.base';

const TAG = 'JSBindingEts';

export class JSBindingEts {
  private static currentContext: NativeContext;

  static screenCapture(mode: string, callback: Function) {
    if (mode === 'area') {
      screenshot.pick().then((pickInfo) => {
        const pixelMap = pickInfo.pixelMap;
        const rectMap = JSBindingEts.parseRectMap(-1, pickInfo.pickRect);
        const imagePackerObj: image.ImagePacker = image.createImagePacker();
        let packOpts: image.PackingOption = { format: "image/jpeg", quality: 98 }
        imagePackerObj.packToData(pixelMap, packOpts).then((data: ArrayBuffer) => {
          try {
            let akiPickInfo: screenAdapter.AkiPickInfo = new screenAdapter.AkiPickInfo(data, rectMap);
            callback(akiPickInfo);
          } catch(err) {
            hilog.error(0x0000, TAG, 'Create AkiPickInfo failed: %{public}s', JSON.stringify(err));
          }
        }).catch((err: BusinessError<string>) => {
          hilog.error(0x0000, TAG, 'packToData failed. code: %{public}d, message: %{public}s', err.code, err.message);
        })
      }).catch((err: BusinessError<string>) => {
        hilog.error(0x0000, TAG, 'screenshot.pick failed. code: %{public}d, message: %{public}s', err.code, err.message);
      })
    } else {
      // mode 形如 "full" / "full_0" (jpeg) 或 "full_png" / "full_0_png" (png)
      // _png 后缀让 ArkTS 端走 image/png packing，给 @qt/electron-screenshots 等需要 png 的插件用
      const wantPng = mode.endsWith('_png');
      const baseMode = wantPng ? mode.slice(0, -'_png'.length) : mode;
      let splitMode = baseMode.split('_');
      let displayId = 0;
      if (splitMode.length >= 2) {
        displayId = Number.parseInt(splitMode[1]) ?? 0;
      }
      hilog.info(0x0000, TAG, 'screenCapture: mode=%{public}s, displayId=%{public}d', mode, displayId);
      screenshot.capture({displayId: displayId}).then((pixelMap) => {
        const imagePackerObj: image.ImagePacker = image.createImagePacker();
        // ArkTS 端 image.PackingOption 的 quality 字段是必填的；png 用 100 表示无损压缩
        let packOpts: image.PackingOption = wantPng
          ? { format: "image/png", quality: 100 }
          : { format: "image/jpeg", quality: 98 };
        // 获取 PixelMap 的实际尺寸
        let imageInfo: image.ImageInfo = pixelMap.getImageInfoSync();
        let rectMap = new Map<string, number>();
        rectMap.set('left', 0);
        rectMap.set('top', 0);
        rectMap.set('width', imageInfo.size.width);
        rectMap.set('height', imageInfo.size.height);
        hilog.info(0x0000, TAG, 'screenCapture: pixelMap size=%{public}d x %{public}d', imageInfo.size.width, imageInfo.size.height);
        imagePackerObj.packToData(pixelMap, packOpts).then((data: ArrayBuffer) => {
          try {
            let akiPickInfo: screenAdapter.AkiPickInfo = new screenAdapter.AkiPickInfo(data, rectMap);
            callback(akiPickInfo);
          } catch(err) {
            hilog.error(0x0000, TAG, 'Create AkiPickInfo failed: %{public}s', JSON.stringify(err));
          }
        }).catch((err: BusinessError<string>) => {
          hilog.error(0x0000, TAG, 'packToData failed. code: %{public}d, message: %{public}s', err.code, err.message);
        })
      }).catch((err: BusinessError<string>) => {
        hilog.error(0x0000, TAG, 'screenshot.capture failed. code: %{public}d, message: %{public}s', err.code, err.message);
      })
    }
  }

  static parseRectMap(displayId?: number, rect?: screenshot.Rect) {
    let rectMap = new Map<string, number>();
    let rectTemp: screenshot.Rect | Record<string, number> = rect ?? {};
    if (displayId !== undefined && displayId >= 0) {
      let displayInfo = display.getDisplayByIdSync(displayId);
      rectTemp = { width: displayInfo.width, height: displayInfo.height}
    }
    rectMap.set('left', rectTemp.left ?? 0);
    rectMap.set('top', rectTemp.top ?? 0);
    rectMap.set('width', rectTemp.width ?? 0);
    rectMap.set('height', rectTemp.height ?? 0);
    return rectMap;
  }

  static init() {
    JSBindingEts.currentContext = screenAdapter.getNativeContext();
  }

  static bind() {
    if (JSBindingEts.currentContext === undefined) {
      JSBindingEts.currentContext = screenAdapter.getNativeContext();
    }
    JSBindingEts.currentContext.JSBind.bindFunction('screenCapture', JSBindingEts.screenCapture);
    JSBindingEts.currentContext.JSBind.bindFunction('getAllDisplaysInfo', JSBindingEts.getAllDisplaysInfo);
  }

  static getAllDisplaysInfo(callback: Function) {
    hilog.info(0x0000, TAG, 'getAllDisplaysInfo: start');
    try {
      display.getAllDisplays((err: BusinessError, data: Array<display.Display>) => {
        if (err.code !== 0) {
          let errMsg = err.message ?? JSON.stringify(err);
          hilog.error(0x0000, TAG, 'getAllDisplaysInfo failed: code=%{public}d, msg=%{public}s', err.code, errMsg);
          callback({code: err.code, data: '[]'});
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
          hilog.info(0x0000, TAG, `getAllDisplaysInfo: display id=${d.id}, physical=(${d.x ?? 0},${d.y ?? 0},${d.width},${d.height}), densityPixels=${item.scale}`);
          return item;
        });
        hilog.info(0x0000, TAG, 'getAllDisplaysInfo: count=%{public}d', result.length);
        callback({code: 0, data: JSON.stringify(result)});
      });
    } catch (e) {
      hilog.error(0x0000, TAG, 'getAllDisplaysInfo exception: %{public}s', JSON.stringify(e));
      callback({code: -1, data: '[]'});
    }
  }

  static getNativeContext(): NativeContext {
    if (JSBindingEts.currentContext !== undefined) {
      return JSBindingEts.currentContext;
    }
    return screenAdapter.getNativeContext();
  }
}
