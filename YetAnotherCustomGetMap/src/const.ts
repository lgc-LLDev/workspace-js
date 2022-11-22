import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

import { description, version } from '../package.json';

export const pluginName = 'YetAnotherCustomGetMap';
export const pluginVersion = version.split('.').map((v) => Number(v));
export const pluginDescription = description;
export const pluginExtra = {
  Author: 'student_2333',
  License: 'Apache-2.0',
};

/** 插件数据文件夹 */
export const dataPath = join('./plugins', pluginName);
/** 用户存放图片文件夹 */
export const imgPath = join(dataPath, 'img');
/** 生成后的二进制文件临时存放文件夹 */
export const tmpPath = join(dataPath, 'tmp');
// 创建文件夹（临时文件夹在index.ts里清理并重新创建了）
[dataPath, imgPath /* , tmpPath */].forEach((p) => {
  if (!existsSync(p)) mkdirSync(p);
});

/** 地图画宽高 */
export const cutSize = 128;
