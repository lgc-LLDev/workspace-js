// LiteLoaderScript Dev Helper
/// <reference path="d:\Coding\LLSEAids/dts/llaids/src/index.d.ts"/>
/* global ll mc JsonConfigFile PermType ParamType */

const pluginName = 'TitleShout';
const pluginVer = [0, 0, 1];

const dataPath = `plugins/${pluginName}`;
const configFilePath = `${dataPath}/config.json`;

const config = new JsonConfigFile(configFilePath);
// const cfgType = config.init('type', 'item');
const cfgItem = config.init('item', 'minecraft:diamond');
const cfgAmount = config.init('amount', 5);

/**
 * @param {Container} container
 * @param {string} itemType
 * @returns {number}
 */
function countContainerItem(container, itemType) {
  let count = 0;
  // log(container.getAllItems().map((v) => `${v.type}:${v.count}`));

  for (const it of container.getAllItems())
    if (it.type === itemType) count += it.count;

  return count;
}

/**
 * @param {Player} player
 * @returns {boolean}
 */
function checkResource(player) {
  return countContainerItem(player.getInventory(), cfgItem) >= cfgAmount;
}

/**
 * @param {Player} player
 */
function removeResource(player) {
  let removedCount = 0;

  const inv = player.getInventory();
  const items = inv.getAllItems();

  for (let i = 0; i < items.length; i += 1) {
    const it = items[i];
    if (it.type === cfgItem) {
      const { count } = it;
      const willRemove = count <= cfgAmount ? count : cfgAmount;
      inv.removeItem(i, willRemove);
      removedCount += willRemove;
      player.refreshItems();
    }

    if (removedCount >= cfgAmount) return;
  }
}

const cmdShout = mc.newCommand('shout', '发公屏标题', PermType.Any);
cmdShout.mandatory('text', ParamType.RawText);
cmdShout.overload(['text']);
cmdShout.setCallback((_, origin, out, { text }) => {
  const { player } = origin;

  if (!player) {
    out.error('命令只能由玩家执行');
    return false;
  }
  if (!checkResource(player)) {
    out.error('需求物品不足');
    return false;
  }
  if (!text) {
    out.error('请输入你要广播的标题内容');
    return false;
  }

  removeResource(player);
  const title = `§6${player.realName} §a说：`;
  for (const pl of mc.getOnlinePlayers()) {
    if (!pl.isSimulatedPlayer()) {
      pl.setTitle(text, 3); // 副标题
      pl.setTitle(title, 2); // 主标题
    }
  }
  return true;
});
cmdShout.setup();

ll.registerPlugin(
  pluginName,
  '让玩家可以花费一些资源来在公屏上打出醒目 Title',
  pluginVer,
  {
    Author: 'student_2333',
    License: 'Apache-2.0',
  }
);
