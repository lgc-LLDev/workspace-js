/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck

// LiteLoaderScript Dev Helper
/// <reference path="d:\Coding\LLSEAids/dts/llaids/src/index.d.ts"/>

// https://github.com/koishijs/koishi/blob/master/packages/cli/src/worker/index.ts

import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'fs';
import { Context, Logger, Time } from 'koishi';
import { join } from 'path';

import NodeLoader from '@koishijs/loader'; // type hint

import { description, version } from '../package.json';
import * as cliLogger from './cli-logger';

// 不这样写会出bug
const Loader = require('@koishijs/loader').default;

/* const */
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
if (!existsSync(dataPath)) mkdirSync(dataPath);
if (!existsSync(koishiConfigPath))
  copyFileSync(join(__dirname, 'res', 'koishi.yml'), koishiConfigPath);
if (!existsSync(dotEnvPath))
  writeFileSync(dotEnvPath, '', { encoding: 'utf-8' });

/* main */

const loader: NodeLoader = new Loader(koishiConfigPath);
const config = loader.readConfig();

cliLogger.prepare(config.logger);

if (config.timezoneOffset !== undefined)
  Time.setTimezoneOffset(config.timezoneOffset);

if (config.stackTraceLimit !== undefined)
  Error.stackTraceLimit = config.stackTraceLimit;

let app: Context;

function handleException(error: unknown) {
  new Logger('app').error(`Koishi 异常退出！${error.stack || error}`);
}

// process.on('uncaughtException', handleException);

process.on('unhandledRejection', (error) => {
  new Logger('app').warn(error);
});

function restartKoishi() {
  (async () => {
    app = await loader.createApp();
    app.plugin(cliLogger);
    await app.start();
  })().catch(handleException);
}

mc.listen('onServerStarted', () => {
  setTimeout(restartKoishi);
});

ll.registerPlugin(pluginName, pluginDescription, pluginVersion, pluginExtra);
