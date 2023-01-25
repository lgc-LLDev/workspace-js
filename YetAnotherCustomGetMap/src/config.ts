import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

import { dataPath } from './const';

const configPath = join(dataPath, 'config.json');

interface Config {
  /** 插件指令名 */
  mainCommand: string;
  // /** 是否只有OP才能使用插件指令（reload除外） */
  // onlyOP: boolean;
  /** 图片列表每页文件数 */
  pageLimit: number;
  /** 是否只有OP才能打开插件主界面 */
  mainPageOP: boolean;
  /** 是否只有OP才能打开地图画编辑表单 */
  getPageOP: boolean;
}

export const config: Config = {
  mainCommand: 'yacgm',
  // onlyOP: true,
  pageLimit: 15,
  mainPageOP: false,
  getPageOP: false,
};

/**
 * 同步保存配置
 */
export function saveConfig() {
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/**
 * 同步重载配置文件
 */
export function reloadConfig() {
  if (!existsSync(configPath)) saveConfig();
  else
    Object.entries(
      JSON.parse(readFileSync(configPath, { encoding: 'utf-8' })) as Config
    ).forEach((x) => {
      const [k, v] = x;
      Object.defineProperty(config, k, { value: v });
    });
}

reloadConfig();
