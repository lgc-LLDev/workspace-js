import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

import { pluginPath } from './const';

// eslint-disable-next-line import/no-unresolved
const NpmClass = require('../../lib/node_modules/npm/lib/npm.js');

export async function installDeps() {
  const modulesPath = join(pluginPath, 'node_modules');
  const npm = new NpmClass();
  await npm.load();

  for (const dir of readdirSync(pluginPath, { withFileTypes: true })) {
    if (dir.isDirectory()) {
      const { name } = dir;
      const path = join(pluginPath, name);
      const jsonPath = join(path, 'package.json');
      if (existsSync(jsonPath)) {
        let packageJson: { dependencies?: { [name: string]: string } };
        try {
          packageJson = JSON.parse(
            readFileSync(jsonPath, { encoding: 'utf-8' })
          );
        } catch (e) {
          logger.error(
            `尝试解析 Koishi 插件 ${name} 的 package.json 失败：${e}`
          );
          continue;
        }

        const { dependencies } = packageJson;
        if (!dependencies) continue;

        let needInstall = false;
        for (const pkg of Object.keys(dependencies)) {
          if (!existsSync(join(modulesPath, pkg))) {
            needInstall = true;
            break;
          }
        }

        if (needInstall) {
          logger.info(`为 Koishi 插件 ${name} 安装依赖……`);

          let res: undefined | Error;
          try {
            npm.localPrefix = pluginPath;
            // eslint-disable-next-line no-await-in-loop
            await npm.exec('install', []);
          } catch (e) {
            npm.output('');
            res = e as Error;
          }

          if (res)
            logger.error(`为 Koishi 插件 ${name} 安装依赖失败\n${res.stack}`);
          else logger.info(`为 Koishi 插件 ${name} 安装依赖成功`);
        }
      }
    }
  }
}

export default {};
