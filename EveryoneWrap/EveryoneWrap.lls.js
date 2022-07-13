/* global ll mc JsonConfigFile Format */
// LiteLoaderScript Dev Helper
/// <reference path="E:\Coding\bds\.vscode\LLSEDevHelper/Library/JS/Api.js" />

const pluginName = 'EveryoneWrap';

const warpConf = new JsonConfigFile(`plugins/${pluginName}/warps.json`);
const alwaysDisplayTasks = new Map();

const {
  Red,
  DarkGreen,
  Green,
  Aqua,
  White,
  LightPurple,
  Bold,
  Clear,
  MinecoinGold,
} = Format;

function getWarpConf() {
  return warpConf.get('wraps', []);
}

function setWarpConf(conf) {
  return warpConf.set('wraps', conf);
}

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

function formatDate(date) {
  const yr = date.getFullYear();
  const mon = date.getMonth();
  const day = date.getDay();
  const hr = date.getHours();
  const min = date.getMinutes().toString().padStart(2, '0');
  const sec = date.getSeconds().toString().padStart(2, '0');
  return `${yr}-${mon}-${day} ${hr}:${min}:${sec}`;
}

function getWarpObj(pl, warpName) {
  function posItem(pos) {
    const { x, y, z, dim, dimid: dimId } = pos;
    return { x, y, z, dim, dimId };
  }

  const { name, realName, xuid, pos } = pl;
  return {
    player: { name, realName, xuid },
    pos: posItem(pos),
    name: warpName,
    date: new Date().toJSON(),
  };
}

function addWarpButton(form, warps) {
  let formTmp = form;
  warps.forEach((i) => {
    const {
      player: { name: playerName },
      pos,
      name,
    } = i;
    formTmp = form.addButton(
      `${Bold}${Green}${name}${Clear}\n` +
        `${formatPos(pos)}${Clear} - ${MinecoinGold}${playerName}`
    );
  });
  return formTmp;
}

function addWarp(pl_) {
  const form = mc
    .newCustomForm()
    .setTitle('添加Warp')
    .addInput(
      '请输入Warp名称，你现在站的位置将会成为Warp坐标',
      '',
      `${pl_.name} 创建的Warp`
    );
  pl_.sendForm(form, (pl, data) => {
    if (data && data[0]) {
      pl.tell(`${Green}创建成功！`);
      const wraps = getWarpConf();
      wraps.push(getWarpObj(pl, data[0]));
      setWarpConf(wraps);
    } else {
      pl.tell(`${Red}操作取消`);
    }
  });
}

function confirmBox(pl, tip, callback) {
  pl.sendModalForm(
    '确认',
    tip,
    `${Green}我想好了`,
    `${Red}我手滑了`,
    (_, res) => {
      if (res) {
        callback();
      } else {
        pl.tell(`${Red}操作取消`);
      }
    }
  );
}

function deleteWrap(pl_) {
  const form = mc
    .newSimpleForm()
    .setTitle('删除Warp')
    .setContent('请选择你要删除的Warp');
  const playerWarps = [];
  getWarpConf().forEach((it) => {
    if (it.player.xuid === pl_.xuid || it.player.permLevel > 0) {
      playerWarps.push(it);
    }
  });
  pl_.sendForm(addWarpButton(form, playerWarps), (pl, id) => {
    if (id !== undefined && id !== null) {
      const warp = playerWarps[id];
      const { name, pos } = warp;
      confirmBox(
        pl,
        `真的要删除Warp ${Bold}${MinecoinGold}${name}${Clear}` +
          `(${formatPos(pos)}${Clear}) 吗？`,
        () => {
          const conf = getWarpConf();
          conf.splice(conf.findIndex((x) => x === warp));
          setWarpConf(conf);
          pl.tell(`${Green}删除成功！`);
        }
      );
    }
  });
}

function clearAlwaysDisplayTask(pl) {
  const { xuid } = pl;
  if (!alwaysDisplayTasks.get(xuid)) {
    pl.tell(`${Red}没有导航进行中`);
    return;
  }

  clearInterval(alwaysDisplayTasks.get(xuid));
  alwaysDisplayTasks.delete(xuid);
  pl.tell(`${Green}本次导航完成~欢迎下次使用~`, 5);
}

function newAlwaysDisplayTask(pl_, warp) {
  const { xuid } = pl_;
  if (alwaysDisplayTasks.get(xuid)) {
    pl_.tell(`${Red}已有导航正在进行中，请先结束`);
    return;
  }

  function task() {
    const pl = mc.getPlayer(xuid);
    const {
      pos: { x, y, z },
    } = pl;
    const { pos, name } = warp;
    const { x: dx, y: dy, z: dz, dimId } = pos;
    const distance = Math.sqrt(
      (x - dx) * (x - dx) + (y - dy) * (y - dy) + (z - dz) * (z - dz)
    ).toFixed(2);

    if (distance <= 3) {
      clearAlwaysDisplayTask(pl);
      return;
    }

    let msg =
      `${Green}${name}${Clear} | ` +
      `${MinecoinGold}目标位置：${formatPos(pos)}${Clear} | `;
    if (pl_.pos.dimid !== dimId) {
      msg += `${Red}维度不匹配`;
    } else {
      msg += `${MinecoinGold}距离 ${Green}${distance} ${MinecoinGold}方块`;
    }
    pl.tell(msg, 5);
  }

  pl_.tell(`${Green}开始为您导航~`);
  pl_.tell(`${Green}开始为您导航~`, 5);
  const taskId = setInterval(task, 500);
  alwaysDisplayTasks.set(xuid, taskId);
}

function warpList(pl) {
  function warpDetail(pl_, warp) {
    const {
      player: { name: playerName, xuid },
      pos,
      name,
      date,
    } = warp;
    const form = mc
      .newSimpleForm()
      .setTitle('Warp详情')
      .setContent(
        `- ${DarkGreen}名称：${Bold}${Green}${name}${Clear}\n` +
          `- ${DarkGreen}创建者：` +
          `${Bold}${Green}${playerName}${Clear}${Green}（${xuid}）${Clear}\n` +
          `- ${DarkGreen}坐标：${Bold}${formatPos(pos)}${Clear}\n` +
          `- ${DarkGreen}创建日期：` +
          `${Bold}${Green}${formatDate(new Date(date))}${Clear}\n`
      )
      .addButton(`${Green}导航`)
      .addButton(`${Green}返回Warp列表`);
    pl_.sendForm(form, (pl__, id) => {
      if (id !== undefined && id !== null) {
        switch (id) {
          case 0:
            newAlwaysDisplayTask(pl__, warp);
            break;
          case 1:
            warpList(pl__);
            break;
          default:
        }
      }
    });
  }

  const warps = getWarpConf();
  const form = mc
    .newSimpleForm()
    .setTitle(pluginName)
    .setContent(`目前已有 ${Green}${warps.length}${Clear} 个Warp`);
  pl.sendForm(addWarpButton(form, warps), (p, i) => {
    if (i !== undefined && i !== null) {
      warpDetail(p, warps[i]);
    }
  });
}

function warpManage(pl_) {
  pl_.sendForm(
    mc
      .newSimpleForm()
      .setTitle('Wrap管理')
      .addButton('添加Warp')
      .addButton('删除Warp')
      .addButton('取消导航'),
    (pl, id) => {
      if (id !== undefined && id !== null) {
        switch (id) {
          case 0:
            addWarp(pl);
            break;
          case 1:
            deleteWrap(pl);
            break;
          case 2:
            clearAlwaysDisplayTask(pl);
            break;
          default:
        }
      }
    }
  );
}

mc.listen('onLeft', (pl) => clearAlwaysDisplayTask(pl));

function registerManageCmd() {
  const cmd = mc.newCommand('warpmanage', '管理Warp');
  cmd.setAlias('warpm');

  cmd.setCallback((_, origin, out) => {
    if (!origin.player) {
      out.error('该命令只能由玩家执行');
      return false;
    }
    warpManage(origin.player);
    return true;
  });

  cmd.overload();
  cmd.setup();
}

function registerListCmd() {
  const cmd = mc.newCommand('warplist', '查看Warp');
  cmd.setAlias('warp');

  cmd.setCallback((_, origin, out) => {
    if (!origin.player) {
      out.error('该命令只能由玩家执行');
      return false;
    }
    warpList(origin.player);
    return true;
  });

  cmd.overload();
  cmd.setup();
}

function registerCmd() {
  registerManageCmd();
  registerListCmd();
}

registerCmd();

ll.registerPlugin(pluginName, '公共坐标点', [0, 1, 1], {
  Author: 'student_2333',
  License: 'Apache-2.0',
});
