/* global lxl mc Format */
// LiteLoaderScript Dev Helper
/// <reference path="E:\Coding\bds\.vscode\LLSEDevHelper/Library/JS/Api.js" />

// const pluginName = 'NavigationAPI';
const exportNamespace = 'NavAPI';
const tasks = new Map();
const { Red, Green, Aqua, White, LightPurple, Clear, MinecoinGold } = Format;

function formatPos(pos) {
  const { x, y, z, dimId } = pos;
  const dim = (() => {
    switch (dimId) {
      case 0:
        return '主世界';
      case 1:
        return '地狱';
      case 2:
        return '末地';
      default:
        return '未知';
    }
  })();
  return (
    `${Green}${x.toFixed(2)} ` +
    `${Red}${y.toFixed(2)} ` +
    `${Aqua}${z.toFixed(2)}` +
    `${White}， ${LightPurple}${dim}`
  );
}

/**
 * 停止导航任务
 *
 * @param {String} xuid 玩家Xuid
 * @returns {Boolean} 是否成功
 */
function clearNavigationTask(xuid) {
  const pl = mc.getPlayer(xuid);
  const taskId = tasks.get(xuid);

  if (!taskId) {
    pl.tell(`${Red}没有导航进行中`);
    return false;
  }

  clearInterval(taskId);
  tasks.delete(xuid);
  pl.tell(`${Green}本次导航完成~欢迎下次使用~`, 5);
  return true;
}

/**
 * 获取玩家是否正在导航中
 *
 * @param {String} xuid 玩家Xuid
 * @returns {Boolean} 玩家导航状态 true为正在导航
 */
function hasNavigationTask(xuid) {
  return !!tasks.get(xuid); // to boolean
}

/**
 * 新建导航任务
 *
 * warp对象必须包含的项目示例
 * {
 *     "pos": {
 *         "x": 39.43924331665039,
 *         "y": 65.62001037597656,
 *         "z": 92.11305236816406,
 *         "dimId": 0
 *     },
 *     "name": "岩浆池"
 * }
 *
 * @param {String} xuid 玩家Xuid
 * @param {Object} warp warp对象，示例见上
 * @returns {Boolean} 是否成功
 */
function newNavigationTask(xuid, warp) {
  const tmpPl = mc.getPlayer(xuid);

  function formatXZPos(x, z) {
    return `${Green}${x.toFixed()} ${Red}~ ${Aqua}${z.toFixed()}`;
  }

  if (hasNavigationTask(xuid)) {
    tmpPl.tell(`${Red}已有导航正在进行中，请先结束`);
    return false;
  }

  function task() {
    const pl = mc.getPlayer(xuid);
    const {
      pos: { x, y, z, dimid: dimId },
    } = pl;
    const { pos, name } = warp;
    const { x: dx, y: dy, z: dz, dimId: dDim } = pos;
    const distance = Math.sqrt(
      (x - dx) * (x - dx) + (y - dy) * (y - dy) + (z - dz) * (z - dz)
    ).toFixed(2);

    let msg =
      `${Green}${name}${Clear} | ` +
      `${MinecoinGold}目标位置：${formatPos(pos)}${Clear} | `;
    if (dimId !== dDim) {
      msg += (() => {
        if (dimId === 2 || dDim === 2) return `${Red}维度不匹配`;
        if (dDim === 1)
          // warp点在地狱
          return `${MinecoinGold}主世界坐标：${formatXZPos(dx * 8, dz * 8)}`;
        if (dDim === 0)
          // warp点在主世界
          return `${MinecoinGold}地狱坐标：${formatXZPos(dx / 8, dz / 8)}`;
        return `${Red}非法导航`;
      })();
    } else {
      if (distance <= 3) {
        clearNavigationTask(pl.xuid);
        return;
      }

      msg += `${MinecoinGold}距离 ${Green}${distance} ${MinecoinGold}方块`;
    }
    pl.tell(msg, 5);
  }

  tmpPl.tell(`${Green}开始为您导航~`);
  tmpPl.tell(`${Green}开始为您导航~`, 5);
  const taskId = setInterval(task, 500);
  tasks.set(xuid, taskId);
  return true;
}

mc.listen('onLeft', (pl) => clearNavigationTask(pl.xuid));

mc.regPlayerCmd('stopnav', '停止导航', (pl) => clearNavigationTask(pl.xuid));

lxl.export(newNavigationTask, `${exportNamespace}_newTask`);
lxl.export(clearNavigationTask, `${exportNamespace}_clearTask`);
lxl.export(hasNavigationTask, `${exportNamespace}_hasTask`);
