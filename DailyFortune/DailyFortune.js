// LiteLoaderScript Dev Helper
/// <reference path="d:\Coding\LLSEAids/dts/llaids/src/index.d.ts"/>
/* global ll mc NBT File PermType ParamType */

// TypeScript 写上头了，所以塞了一堆类型注解

const PLUGIN_NAME = 'DailyFortune';
const PLUGIN_VERSION = [0, 1, 0];

const PLUGIN_DATA_PATH = `plugins/${PLUGIN_NAME}`;
const PLUGIN_CONFIG_PATH = `${PLUGIN_DATA_PATH}/config.json`;
const PLAYER_CONFIG_PATH = `${PLUGIN_DATA_PATH}/player.json`;
const FORTUNE_CONFIG_PATH = `${PLUGIN_DATA_PATH}/fortune.json`;
const DUMPED_ITEMS_FOLDER = `${PLUGIN_DATA_PATH}/dumped`;

/**
 * @typedef {Object} PluginConfig
 * @property {boolean} broadcast
 * @property {boolean} enableAward
 */
/** @type {PluginConfig} */
let pluginConfig = {};
/**
 * @typedef {Object} LastFortune
 * @property {number} id
 * @property {number} contentIndex
 */
/**
 * @typedef {Object} PlayerConfig
 * @property {string} lastDate
 * @property {LastFortune} lastFortune
 */
/** @type {{[xuid: string]: PlayerConfig}} */
let playerConfig = {};
/**
 * @typedef {Object} FortuneAward
 * @property {string} [type]
 * @property {number} [amount]
 * @property {number} [aux]
 * @property {string} [sNbt]
 * @property {string} [scoreName]
 * @property {string} [filename]
 */
/**
 * @typedef {Object} Fortune
 * @property {number} id
 * @property {string} title
 * @property {string[]} content
 * @property {FortuneAward[]} award
 */
/** @type {Fortune[]} */
let fortuneConfig = [];

/**
 * @param {string} path
 * @param {any} conf
 * @return {boolean}
 */
function writeConfig(path, conf) {
  return File.writeTo(path, JSON.stringify(conf, null, 2));
}

/**
 * @param {string} path
 * @param {any} defaultConf
 * @returns {any}
 */
function initConfig(path, defaultConf = {}) {
  let conf = defaultConf;
  if (File.exists(path)) {
    conf = JSON.parse(File.readFrom(path));

    if (defaultConf instanceof Object && !Array.isArray(defaultConf)) {
      Object.entries(defaultConf).forEach(([k, v]) => {
        if (!(k in conf)) conf[k] = v;
      });
    }
  }

  writeConfig(path, conf);
  return conf;
}

function loadConfig() {
  pluginConfig = initConfig(PLUGIN_CONFIG_PATH, {
    broadcast: true,
    enableAward: true,
  });
  playerConfig = initConfig(PLAYER_CONFIG_PATH);
  fortuneConfig = initConfig(FORTUNE_CONFIG_PATH, []);
}

/**
 * @param {number} minNum
 * @param {number} maxNum
 * @returns {number}
 */
function randomInt(minNum, maxNum) {
  return parseInt(Math.random() * (maxNum - minNum + 1) + minNum, 10);
}

/**
 * @param {Date} date1
 * @param {Date} [date2]
 * @returns {boolean} date1 = date2
 */
function compareDate(date1, date2) {
  /** @type {(d: Date) => number} */
  const extractDate = (d) => {
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  };

  return extractDate(date1) === extractDate(date2 || new Date());
}

/**
 * @param {Fortune} fortune
 * @param {number} contentIndex
 * @param {string} [playerName]
 * @returns {string}
 */
function formatFortune(fortune, contentIndex, playerName) {
  const { title, content } = fortune;
  if (contentIndex >= content.length) contentIndex = content.length - 1;

  const prefix =
    pluginConfig.broadcast && playerName ? `§5玩家 §3${playerName} §5` : `§5你`;
  return `${prefix}的今日运势： ${title}\n§7§o${content[contentIndex]}`;
}

/**
 * @param {number} id
 * @returns {Fortune | undefined}
 */
function getFortuneById(id) {
  for (const x of fortuneConfig) if (x.id === id) return x;
  return undefined;
}

/**
 * @returns {[Fortune, number]}
 */
function rollFortune() {
  const rolledIndex = randomInt(0, fortuneConfig.length - 1);
  const rolled = fortuneConfig[rolledIndex];
  const contentIndex = randomInt(0, rolled.content.length - 1);
  return [rolled, contentIndex];
}

/**
 * @param {Player} player
 * @param {FortuneAward[]} award
 */
function giveAward(player, award) {
  const getItem = ({ type, amount, aux, sNbt, scoreName, filename }) => {
    if (type === 'dumped') {
      award = JSON.parse(File.readFrom(`${DUMPED_ITEMS_FOLDER}/${filename}`));
      return getItem(award);
    }

    if (type === 'money') {
      player.addMoney(amount);
      return null;
    }
    if (type === 'score') {
      const scoreObj = mc.getScoreObjective(scoreName);
      if (!scoreObj) {
        // scoreObj = mc.newScoreObjective(scoreName, scoreName);
        mc.runcmd(`scoreboard objectives add "${scoreName}" dummy`);
      }

      // scoreObj.addScore(player, amount); // 有bug
      mc.runcmd(
        `scoreboard players add "${player.realName}" "${scoreName}" ${amount}`
      );
      return null;
    }

    if (sNbt) return mc.newItem(NBT.parseSNBT(sNbt));

    const it = mc.newItem(type, amount);
    if (typeof aux === 'number') it.setAux(aux);
    return it;
  };

  const items = award.map(getItem).filter((v) => v);

  const container = player.getInventory();
  for (const it of items) {
    if (container.hasRoomFor(it)) container.addItem(it);
    else mc.spawnItem(it, player.pos);
  }
  player.refreshItems();
}

/**
 * @param {Player} player
 */
function todayFortune(player) {
  if (!fortuneConfig.length) {
    player.tell('§c配置文件中还没有配置运势内容');
    return;
  }

  const { xuid } = player;
  const { lastDate, lastFortune } = playerConfig[xuid] || {};

  let fortune;
  let contentIndex;
  let newFortune = true;
  if (lastDate && compareDate(new Date(lastDate))) {
    fortune = getFortuneById(lastFortune.id);
    contentIndex = lastFortune.contentIndex;
    newFortune = false;
  } else {
    [fortune, contentIndex] = rollFortune();

    playerConfig[xuid] = {
      lastDate: new Date().toJSON(),
      lastFortune: { id: fortune.id, contentIndex },
    };
    writeConfig(PLAYER_CONFIG_PATH, playerConfig);

    if (pluginConfig.enableAward) giveAward(player, fortune.award);
  }

  const fortuneText = formatFortune(fortune, contentIndex, player.realName);
  if (pluginConfig.broadcast && newFortune) mc.broadcast(fortuneText);
  else player.tell(fortuneText);
}

/**
 * @param {Player} player
 */
function dumpItem(player) {
  const it = player.getHand();
  if (it.isNull()) {
    player.tell('§c请手持要获取NBT的物品');
    return;
  }

  const sNbt = it.getNbt().toSNBT();
  const itJson = JSON.stringify({ sNbt }, null, 2);

  const filename = `${new Date().getTime()}.json`;
  const path = `${DUMPED_ITEMS_FOLDER}/${filename}`;
  File.writeTo(path, itJson);
  player.tell(`§a已将手持物品的NBT导出至 §6${path}`);
}

/**
 * @param {Player} player
 * @returns {boolean}
 */
function checkOpAndTip(player) {
  const { permLevel } = player;
  const isOp = permLevel > 0;
  if (!isOp) player.tell('§c仅OP能执行这个命令');
  return isOp;
}

const fortuneCmd = mc.newCommand('fortune', '今日运势', PermType.Any);

fortuneCmd.setEnum('enumDump', ['dump']);
fortuneCmd.setEnum('enumReload', ['reload']);

fortuneCmd.mandatory('enumDump', ParamType.Enum, 'enumDump', 1);
fortuneCmd.mandatory('enumReload', ParamType.Enum, 'enumReload', 1);

fortuneCmd.overload([]);
fortuneCmd.overload(['enumDump']);
fortuneCmd.overload(['enumReload']);

fortuneCmd.setCallback((_, { player }, out, { enumDump, enumReload }) => {
  if (enumReload) {
    if (!player || checkOpAndTip(player)) {
      loadConfig();
      out.success('§a配置已重载');
      return true;
    }
    return false;
  }

  if (!player) {
    out.error('仅玩家可以执行这个命令');
    return false;
  }

  if (enumDump) {
    if (checkOpAndTip(player)) dumpItem(player);
  } else {
    todayFortune(player);
  }

  return true;
});
fortuneCmd.setup();

loadConfig();
ll.registerPlugin(PLUGIN_NAME, '今日运势', PLUGIN_VERSION, {
  Author: 'student_2333',
  License: 'Apache-2.0',
});
