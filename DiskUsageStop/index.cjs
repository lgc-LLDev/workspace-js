// LiteLoaderScript Dev Helper
/// <reference path="d:\Coding\LLSEAids/dts/llaids/src/index.d.ts"/>
/* global logger ll mc logger */

const { existsSync, mkdirSync, writeFileSync, readFileSync } = require('fs');
const { resolve, join } = require('path');
const checkDiskSpace = require('check-disk-space').default;

const config = {
  checkInterval: 60,
  percent: 0.95,
  stopInterval: 20,
  showDiskLog: true,
};

const pluginName = 'DiskUsageStop';
const pluginVer = [0, 1, 0];

const pluginDataPath = `plugins/${pluginName}`;
const pluginConfigPath = join(pluginDataPath, 'config.json');
if (!existsSync(pluginDataPath)) mkdirSync(pluginDataPath);

logger.setTitle(pluginName);

function formatError(e) {
  let msg = e;
  if (e instanceof Error) msg = e.stack || e.message;
  return String(msg);
}

function logError(e) {
  logger.error(`插件出错！\n${formatError(e)}`);
}

function reloadConfigSync() {
  if (!existsSync(pluginConfigPath)) {
    logger.warn(`插件配置文件不存在，已写入默认配置到 ${pluginConfigPath}`);
    writeFileSync(pluginConfigPath, JSON.stringify(config, undefined, 2), {
      encoding: 'utf-8',
    });
  } else {
    let loadedConf;
    try {
      loadedConf = JSON.parse(
        readFileSync(pluginConfigPath, { encoding: 'utf-8' })
      );
    } catch (e) {
      logger.error(`读取插件配置失败，将使用默认配置\n${formatError(e)}`);
      return;
    }

    Object.entries(loadedConf).forEach((e) => {
      const [k, v] = e;
      config[k] = v;
    });
  }
}

/**
 * @param {(...args:any[])=>Promise<Any>} func
 */
function warpAsyncFunction(func) {
  return (...args) => {
    func(...args).catch(logError);
  };
}

/**
 * @param {number} space
 * @param {number} pointLength
 * @returns
 */
function formatSpace(space, pointLength = 2) {
  const units = ['B', 'K', 'M', 'G'];
  let currentUnit = units.shift();
  while (units.length > 0 && space >= 1024) {
    currentUnit = units.shift();
    space /= 1024;
  }
  return `${space.toFixed(pointLength)}${currentUnit}`;
}

mc.listen('onServerStarted', () => {
  const checkTask = async () => {
    const { stopInterval, percent, showDiskLog } = config;
    const { free, size } = await checkDiskSpace(resolve(__dirname));

    const usedSpace = size - free;
    const usedPercent = usedSpace / size;

    const formattedUsed = formatSpace(usedSpace);
    const formattedTotal = formatSpace(size);
    const formattedPercent = (usedPercent * 100).toFixed(2);

    if (showDiskLog)
      logger.info(
        `[定时监测] 磁盘已用 ${formattedUsed} / ${formattedTotal} (${formattedPercent}%)`
      );

    if (usedPercent >= percent) {
      logger.warn('磁盘使用达到限制，即将关服');

      const toastTitle =
        `§g服务器存储占用已到达 §c§l${formattedPercent}%%§r ` +
        `§7（§e${formattedUsed} §7/ §6${formattedTotal}§7）§g！`;
      const toastMsg = `§g将在 §d§l${stopInterval} §r§g秒后关闭服务器！`;
      mc.getOnlinePlayers().forEach((p) => p.sendToast(toastTitle, toastMsg));
      mc.broadcast(`${toastTitle}\n${toastMsg}`);

      let countdown = stopInterval;
      const stopTask = setInterval(() => {
        countdown -= 1;
        if (countdown <= 0) {
          mc.runcmd('stop');
          clearInterval(stopTask);
        } else {
          mc.broadcast(`§g还有 §d§l${countdown} §r§g秒关闭服务器！`);
        }
      }, 1000);
    }
  };

  setInterval(warpAsyncFunction(checkTask), config.checkInterval * 1000);
  checkTask();
});

reloadConfigSync();
ll.registerPlugin(
  pluginName,
  '当你BDS所在硬盘分区使用量超过指定比例时停服',
  pluginVer,
  {
    Author: 'student_2333',
    License: 'Apache-2.0',
  }
);
