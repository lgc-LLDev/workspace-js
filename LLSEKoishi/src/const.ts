import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

import { description, version } from '../package.json';

export const pluginName = 'LLSEKoishi';
export const pluginVersion = version.split('.').map((v) => Number(v));
export const pluginDescription = description;
export const pluginExtra = {
  Author: 'student_2333',
  License: 'Apache-2.0',
};

export const dataPath = join('./plugins', pluginName);
export const koishiConfigPath = join(dataPath, 'koishi.yml');
export const dotEnvPath = join(dataPath, '.env');
export const pluginPath = join(dataPath, 'plugins');

export const resourceDir = join(__dirname, 'res');

const pluginFolderJsonPath = join(pluginPath, 'package.json');

if (!existsSync(dataPath)) mkdirSync(dataPath);
if (!existsSync(pluginPath)) mkdirSync(pluginPath);
if (!existsSync(koishiConfigPath))
  copyFileSync(join(resourceDir, 'koishi.yml'), koishiConfigPath);
if (!existsSync(dotEnvPath))
  writeFileSync(dotEnvPath, '', { encoding: 'utf-8' });
if (!existsSync(pluginFolderJsonPath))
  copyFileSync(join(resourceDir, 'package.json'), pluginFolderJsonPath);

logger.setTitle(pluginName);
