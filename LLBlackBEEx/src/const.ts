import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

import { description, version } from '../package.json';

export const pluginName = 'LLBlackBEEx';
export const pluginVersion = version.split('.').map((v) => Number(v));
export const pluginDescription = description;
export const pluginExtra = {
  Author: 'student_2333',
  License: 'Apache-2.0',
};

export const dataPath = join('./plugins', pluginName);
if (!existsSync(dataPath)) mkdirSync(dataPath);
