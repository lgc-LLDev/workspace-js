// LiteLoaderScript Dev Helper
/// <reference path="d:\Coding\bds\LLSEAids/dts/llaids/src/index.d.ts"/>
/* eslint-disable no-await-in-loop */
/* global ll mc logger ParticleColor File */

const PLUGIN_NAME = 'Airdrop';
const PLUGIN_VERSION = [0, 1, 4];

const PLUGIN_DATA_PATH = `plugins/${PLUGIN_NAME}`;
const PLUGIN_CONFIG_PATH = `${PLUGIN_DATA_PATH}/config.json`;

/** @typedef {[number, number]} XZPos */
/** @typedef {[number, number, number]} XZDimPos */
/** @typedef {[number, number, number, number]} XYZDimPos */
/**
 * @typedef {Object} AwardConfig
 * @property {string} type 物品id
 * @property {[number, number]} amountRange 出现的几率
 * @property {number} chance 如果出现了，出现的物品数量
 * @property {number} [aux] 物品特殊值
 * @property {string} [sNbt] 物品snbt字符串 如果有这一项则其他项会被忽略
 */
/**
 * @typedef {Object} Config
 * @property {number} interval
 * @property {[XZPos, XZPos]} range
 * @property {number} summonRadius
 * @property {AwardConfig[]} award
 * @property {number} maxAirdrops
 * @property {number} maxRetries
 * @property {string} triggerItem
 * @property {number} nearbyDistance
 * @property {string} tipSoundId
 * @property {string} lightBeamColor
 * @property {number} lightBeamWidth
 * @property {number} lightBeamDotCount
 */
/** @type {Config} */
let pluginConfig = {
  interval: 7200000,
  summonRadius: 500,
  maxAirdrops: 5,
  maxRetries: 3,
  nearbyDistance: 10,
  triggerItem: 'minecraft:chorus_fruit',
  tipSoundId: 'mob.enderdragon.growl',
  lightBeamColor: 'Red',
  lightBeamWidth: 8,
  lightBeamDotCount: 4,
  range: [
    [-8000, -8000],
    [8000, 8000],
  ],
  award: [
    {
      type: 'minecraft:netherite_ingot',
      chance: 1,
      amountRange: [0, 2],
    },
    {
      type: 'minecraft:diamond',
      chance: 1,
      amountRange: [1, 4],
    },
    {
      type: 'minecraft:gold_ingot',
      chance: 1,
      amountRange: [3, 6],
    },
    {
      type: 'minecraft:iron_ingot',
      chance: 1,
      amountRange: [4, 12],
    },
    {
      type: 'minecraft:coal',
      chance: 1,
      amountRange: [0, 32],
    },
  ],
};

/** @type {{[dimId: string]: [number, number]}} */
const DIM_HEIGHT_RANGE = {
  0: [320, -64],
  1: [127, 0],
  2: [255, 0],
};

/** @type {{[dimId: string]: string}} */
const DIM_CHN_NAME_MAP = {
  0: '主世界',
  1: '下界',
  2: '末地',
};

/** @type {{[dimId: string]: string}} */
const DIM_NAMESPACE_MAP = {
  0: 'overworld',
  1: 'the_nether',
  2: 'the_end',
};

/**
 * @typedef {Object} DroppedAirdrop
 * @property {number} id
 * @property {XYZDimPos} pos
 * @property {number} barColor
 */
/** @type {DroppedAirdrop[]} */
const droppedAirdrops = [];
/** @type {string[]} */
const summonedToolMans = [];
let droppingAirdrop = false;

let particleSpawner = null;
try {
  particleSpawner = mc.newParticleSpawner();
} catch (e) {
  logger.warn('ParticleAPI加载失败，将使用烟花代替空投光柱！');
}

function updateConfig() {
  File.writeTo(PLUGIN_CONFIG_PATH, JSON.stringify(pluginConfig, null, 2));
}

function loadConfig() {
  if (File.exists(PLUGIN_CONFIG_PATH))
    pluginConfig = JSON.parse(File.readFrom(PLUGIN_CONFIG_PATH));
  else updateConfig();
}

loadConfig();

/**
 * @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
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
 * @param {number} num
 * @param {number} range
 * @returns {number}
 */
function randomRange(num, range) {
  return randomInt(num - range, num + range);
}

/**
 * @template T
 * @param {T} obj
 * @param {any} key
 * @param {any} [defaultKey]
 * @returns {T[key] | T[defaultKey]}
 */
function getObjectProperty(obj, key, defaultKey = '0') {
  key = String(key);
  if (!(key in obj)) key = String(defaultKey);
  return obj[key];
}

/**
 * @param {XYZDimPos} pos
 * @returns {string}
 */
function formatPos(pos) {
  const [x, y, z, dimId] = pos;
  const dim = getObjectProperty(DIM_CHN_NAME_MAP, dimId);
  return `§d${dim} §a${x} §c${y} §b${z}§r`;
}

/**
 * @param {0 | 1 | 2} dimId
 * @returns {string}
 */
function getDimNamespace(dimId) {
  return getObjectProperty(DIM_NAMESPACE_MAP, dimId);
}

/**
 * @returns {Player[]}
 */
function getOnlineRealPlayers() {
  return mc.getOnlinePlayers().filter((p) => !p.isSimulatedPlayer());
}

function playTipSound() {
  const { tipSoundId } = pluginConfig;
  if (tipSoundId)
    mc.runcmdEx(`execute as @a at @a run playsound ${tipSoundId} @s ~~~`);
}

/**
 * @param {Item} item
 * @param {number} count
 * @returns {Item}
 */
function modifyItemCount(item, count) {
  const newNbt = item.getNbt();
  newNbt.setByte('Count', count);
  item.setNbt(newNbt);
  return item;
}

/**
 * @returns {Item[]}
 */
function getAwardItems() {
  const items = [];
  for (const obj of pluginConfig.award) {
    const {
      type,
      amountRange: [min, max],
      chance,
      aux,
      sNbt,
    } = obj;

    if (Math.random() > chance) continue;

    const amount = randomInt(min, max);
    if (!amount) continue;

    let item;
    if (sNbt) {
      item = modifyItemCount(mc.newItem(sNbt), amount);
    } else {
      item = mc.newItem(type, amount);
      if (typeof aux === 'number') item.setAux(aux);
    }
    items.push(item);
  }
  return items.filter((v) => v);
}

/**
 * @param {XZDimPos} pos
 * @returns {Promise<boolean>}
 */
async function trySummonAirdrop(pos) {
  const [x, z, dimId] = pos;
  // const dimName = getDimNamespace(dimId);
  const [maxY, minY] = DIM_HEIGHT_RANGE[dimId];

  const timestamp = new Date().getTime();

  logger.log(`空投选点 x=${x} z=${z} dimId=${dimId}，召唤假人加载区块`);
  const loadToolMan = mc.spawnSimulatedPlayer(
    `ToolMan${randomInt(100000, 999999)}`,
    x,
    maxY,
    z,
    dimId
  );
  summonedToolMans.push(loadToolMan.uuid);

  while (!mc.getBlock(x, maxY, z, dimId)) {
    await sleep(200);
  }
  logger.log(`空投生成区域预加载完毕`);

  let lastBlock;
  // eslint-disable-next-line for-direction
  for (let y = maxY; y >= minY; y -= 1) {
    const block = mc.getBlock(x, y, z, dimId);
    // logger.info(`y=${y} block=${block.type}`);
    if (
      block &&
      lastBlock &&
      block.type !== 'minecraft:air' &&
      lastBlock.type === 'minecraft:air'
    ) {
      y += 1;

      if (mc.setBlock(x, y, z, dimId, 'minecraft:chest')) {
        logger.info(`空投最终落点 x=${x} y=${y} z=${z} dimId=${dimId}`);

        droppedAirdrops.push({
          pos: [x, y, z, dimId],
          id: timestamp,
          barColor: randomInt(0, 6),
        });

        // 没办法 凑合一下吧
        setTimeout(() => {
          const chest = mc.getBlock(x, y, z, dimId);
          const container = chest.getContainer();

          for (const it of getAwardItems())
            container.addItemToFirstEmptySlot(it);

          loadToolMan.simulateDisconnect();
        }, 0);

        playTipSound();
        return true;
      }
    }
    lastBlock = block;
    await sleep(0);
  }

  loadToolMan.simulateDisconnect();
  return false;
}

/**
 * @param {XYZDimPos} pos
 * @param {number} [yOffset]
 */
function spawnFirework([x, y, z, dimId], yOffset = 0) {
  const dimName = getDimNamespace(dimId);
  mc.runcmdEx(
    `execute in ${dimName} run ` +
      `summon minecraft:fireworks_rocket ${x} ${y + yOffset} ${z}`
  );
}

/**
 * @param {XYZDimPos} pos
 * @param {number} [yOffset]
 */
function spawnLightBeam(pos, yOffset = 0) {
  if (particleSpawner) {
    const [x, yOrg, z, dimId] = pos;
    const y = yOrg + yOffset;

    const { lightBeamColor, lightBeamWidth, lightBeamDotCount } = pluginConfig;
    const [yMax] = DIM_HEIGHT_RANGE[dimId];
    const start = mc.newIntPos(x, y, z, dimId);
    const end = mc.newIntPos(x, yMax, z, dimId);
    particleSpawner.drawOrientedLine(
      start,
      end,
      lightBeamWidth,
      0,
      (yMax - y) * lightBeamDotCount,
      ParticleColor[lightBeamColor]
    );
  } else {
    pos = [...pos];
    pos[1] += 1; // y+1
    spawnFirework(pos);
  }
}

setInterval(() => {
  for (const { id, pos, barColor } of droppedAirdrops) {
    const [x, y, z, dimId] = pos;
    // const dimName = getDimNamespace(dimId);

    for (const player of getOnlineRealPlayers()) {
      let distanceTip;
      if (dimId === player.pos.dimid) {
        const distance = player.distanceTo(x, y, z, dimId).toFixed(2);
        distanceTip = `§r距离 §g${distance} §r方块`;
      } else {
        distanceTip = `§c维度不匹配`;
      }

      player.setBossBar(
        id,
        `有空投降落于 ${formatPos(pos)} §7| ${distanceTip}`,
        100,
        barColor
      );
      spawnLightBeam(pos);
    }
  }
}, 1000);

/**
 * @param {IntPos} pos
 */
function removeAirdrop(pos) {
  for (let i = 0; i < droppedAirdrops.length; i += 1) {
    const {
      id,
      pos: [x, y, z, dimId],
    } = droppedAirdrops[i];
    // const dimName = getDimNamespace(dimId);

    if (pos.x === x && pos.y === y && pos.z === z && pos.dimid === dimId) {
      for (const player of getOnlineRealPlayers()) player.removeBossBar(id);
      droppedAirdrops.splice(i, 1);

      const { nearbyDistance } = pluginConfig;
      const nearbyPlayers = getOnlineRealPlayers()
        .filter((p) => p.distanceTo(pos) <= nearbyDistance)
        .map((p) => p.realName)
        .join('§7; §b');

      mc.broadcast(
        `§e位于 ${formatPos([x, y, z, dimId])} §e的空投已被打开！` +
          `${nearbyPlayers ? `\n§e该空投附近的玩家： §b${nearbyPlayers}` : ''}`
      );
      playTipSound();
      break;
    }
  }
}

mc.listen('onMobHurt', (mob) => {
  if (mob.isPlayer()) {
    const player = mob.toPlayer();
    if (summonedToolMans.includes(player.uuid)) return false;
  }
  return true;
});

mc.listen('onBlockChanged', (before, after) => {
  if (before.type === 'minecraft:chest' && after.type === 'minecraft:air') {
    const { pos } = after;
    removeAirdrop(pos);
  }
});

mc.listen('onBlockInteracted', (_, block) => {
  if (block.type === 'minecraft:chest') {
    const { pos } = block;
    removeAirdrop(pos);
  }
});

/**
 * @param {string} msg
 * @param {Player} [player]
 */
const tell = (msg, player) => {
  if (player) {
    player.tell(msg);
  } else {
    const msgFormatted = msg.replace(/§[a-z0-9]/g, '');
    if (msg.startsWith('§c')) logger.error(msgFormatted);
    else logger.info(msgFormatted);
  }
};

/**
 * @param {Player} [player]
 */
function preCheckCanSummon(player) {
  const { maxAirdrops } = pluginConfig;

  if (droppedAirdrops.length >= maxAirdrops) {
    tell(`§c已达同时存在空投上限，无法再召唤空投`, player);
    return false;
  }
  if (droppingAirdrop) {
    tell(`§c已经有一个空投在召唤了，请不要同时召唤其他空投`, player);
    return false;
  }

  return true;
}

/**
 * @param {Player} [player]
 * @returns {Promise<boolean>}
 */
async function summonAirdrop(player) {
  const {
    summonRadius,
    maxRetries,
    range: [[minX, minZ], [maxX, maxZ]],
  } = pluginConfig;

  let centerX;
  let centerZ;
  let dimId;
  if (player) {
    ({ x: centerX, z: centerZ, dimid: dimId } = player.pos);
  } else {
    centerX = randomInt(minX, maxX);
    centerZ = randomInt(minZ, maxZ);
    dimId = 0;
  }

  tell('§a正在尝试召唤空投！');
  if (player) spawnFirework([centerX, player.pos.y, centerZ, dimId]);

  for (let i = 0; i < maxRetries; i += 1) {
    const x = randomRange(centerX, summonRadius);
    const z = randomRange(centerZ, summonRadius);
    if (x >= minX && z >= minZ && x <= maxX && z <= maxZ) {
      droppingAirdrop = true;
      try {
        if (await trySummonAirdrop([x, z, dimId])) {
          const tipFrom = player
            ? `§a玩家 §g${player.realName} §a`
            : `§a服务器自动`;
          mc.broadcast(`${tipFrom}召唤了一个空投！`);
          playTipSound();
          return true;
        }
      } catch (e) {
        logger.error(String(e));
        tell('§c空投召唤失败！');
      } finally {
        droppingAirdrop = false;
      }
    }
  }

  tell(
    `§c我们尝试了 ${maxRetries} 次都没有找到适合的空投落点，请换个地方再试试吧`
  );
  return false;
}

if (pluginConfig.interval) {
  setInterval(() => {
    if (preCheckCanSummon()) summonAirdrop();
  }, pluginConfig.interval);
}

mc.listen('onUseItem', (player) => {
  const { triggerItem } = pluginConfig;
  const item = player.getHand();
  if (item.type === triggerItem) {
    if (!preCheckCanSummon(player)) return false;

    const { count } = item;
    modifyItemCount(item, count - 1);
    player.refreshItems();

    setTimeout(() => {
      (async () => {
        if (!(await summonAirdrop(player))) {
          player.getInventory().addItem(modifyItemCount(item.clone(), 1));
          player.refreshItems();
        }
      })();
    }, 0);
    return false;
  }
  return true;
});

ll.registerPlugin(PLUGIN_NAME, '空投', PLUGIN_VERSION, {
  Author: 'student_2333',
  License: 'Apache-2.0',
});
