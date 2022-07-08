/* eslint-disable no-template-curly-in-string */
/* global ll mc JsonConfigFile logger */
// LiteXLoader Dev Helper
/// <reference path="E:\Coding\bds\.vscode\LLSEDevHelper/Library/JS/Api.js" />

const defaultConf = {
  noSource: ['${player.name} 暴毙了'],
  hasSource: ['${player.name} 被 ${source.name} 裁决了'],
};

const config = new JsonConfigFile(
  'plugins/CustomDeathMsg/config.json',
  JSON.stringify(defaultConf)
);

function getConf(name) {
  const conf = config.get(name);
  if (!conf || conf === []) return defaultConf[name];
  return conf;
}

const noSource = getConf('noSource');
const hasSource = getConf('hasSource');

/**
 * 生成指定区间随机整数
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

/**
 * 格式化死亡信息
 * @param {string} msg
 * @param {Player} player
 * @param {Entity} source
 */
function getDieMsg(player, source) {
  const msgs = source ? hasSource : noSource;
  const msg = msgs[getRandomInt(0, msgs.length - 1)];

  // eslint-disable-next-line no-eval
  const formatted = eval(`\`${msg}\``);

  if (formatted.trim()) return formatted;
  return getDieMsg(player, source);
}

mc.listen('onPlayerDie', (player, source) => {
  const msg = getDieMsg(player, source);
  mc.broadcast(msg);
  logger.info(msg);
});

mc.listen('onServerStarted', () => {
  if (mc.runcmd('gamerule showdeathmessages false')) {
    logger.info('成功设置隐藏原来的死亡信息');
    logger.info('卸载插件后请使用 gamerule showdeathmessages true 指令恢复');
  } else {
    logger.error(
      '设置隐藏原来的死亡信息失败！请手动执行 gamerule showdeathmessages false'
    );
  }
});

ll.registerPlugin('CustomDeathMsg', '自定义玩家去世信息', [0, 1, 0], {
  Author: 'student_2333',
  License: 'Apache-2.0',
});
