// LiteLoaderScript Dev Helper
/// <reference path="d:\Coding\LLSEAids/dts/llaids/src/index.d.ts"/>

import {
  pluginDescription,
  pluginExtra,
  pluginName,
  pluginVersion,
} from './const';
import { deleteTmpDirSync, throwToMain } from './util';

logger.setTitle(pluginName);

deleteTmpDirSync();

if (!ll.require('CustomMap.dll')) {
  throw ReferenceError('依赖插件 CustomMap.dll 未加载！');
}

(async () => {
  await import('./config'); // 先初始化配置
  await import('./command');
  await import('./yoyo-ext');
})().catch(throwToMain);

ll.registerPlugin(pluginName, pluginDescription, pluginVersion, pluginExtra);
