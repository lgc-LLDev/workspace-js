/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
// LiteLoaderScript Dev Helper
/// <reference path="d:\Coding\LLSEAids/dts/llaids/src/index.d.ts"/>

// https://github.com/koishijs/koishi/blob/master/packages/cli/src/worker/index.ts

import { Context, Logger, Time } from 'koishi';

import NodeLoader from '@koishijs/loader'; // type hint

import * as cliLogger from './cli-logger';
import {
  koishiConfigPath,
  pluginDescription,
  pluginExtra,
  pluginName,
  pluginVersion,
} from './const';
import { installDeps } from './dependencies';

// 不这样写会出bug
const Loader = require('@koishijs/loader').default;

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
    logger.info('启动 Koishi ……');
    app = await loader.createApp();
    app.plugin(cliLogger);
    await app.start();
  })().catch(handleException);
}

mc.listen('onServerStarted', () => {
  setTimeout(async () => {
    await installDeps().catch(console.log);
    restartKoishi();
  });
});

ll.registerPlugin(pluginName, pluginDescription, pluginVersion, pluginExtra);
