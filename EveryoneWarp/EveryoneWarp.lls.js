/* global ll mc JsonConfigFile Format PermType logger */
// LiteLoaderScript Dev Helper
/// <reference path="E:\Coding\bds\.vscode\LLSEDevHelper/Library/JS/Api.js" />

const pluginName = 'EveryoneWarp';
const confDir = `plugins/${pluginName}`;
const confPath = `${confDir}/warps.json`;
const warpConf = new JsonConfigFile(confPath);

ll.require(
  'NavigationAPI.lls.js',
  'https://www.lgc2333.top/llse/NavigationAPI.min.lls.js'
);
const newNavigationTask = ll.import('NavAPI_newTask');
const clearNavigationTask = ll.import('NavAPI_clearTask');
const hasNavigationTask = ll.import('NavAPI_hasTask');

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
  return warpConf.get('warps', []);
}

function setWarpConf(conf) {
  return warpConf.set('warps', conf);
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
  const mon = date.getMonth() + 1;
  const day = date.getDate();
  const hr = date.getHours();
  const min = date.getMinutes().toString().padStart(2, '0');
  const sec = date.getSeconds().toString().padStart(2, '0');
  return `${yr}-${mon}-${day} ${hr}:${min}:${sec}`;
}

function getWarpObj(pl, pos, warpName, desc = null) {
  const { name, realName, xuid } = pl;
  return {
    player: { name, realName, xuid },
    pos,
    name: warpName,
    date: new Date().toJSON(),
    desc,
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
      `${Bold}${DarkGreen}${name}${Clear}\n` +
        `${formatPos(pos)}${Clear} - ${MinecoinGold}${playerName}`
    );
  });
  return formTmp;
}

function addWarp(pl_) {
  const {
    pos: { x: x_, y: y_, z: z_, dimid: dimId_ },
  } = pl_;
  const strX = x_.toFixed(2).toString();
  const strY = y_.toFixed(2).toString();
  const strZ = z_.toFixed(2).toString();
  const form = mc
    .newCustomForm()
    .setTitle('添加Warp')
    .addInput('Warp名称', '', `${pl_.name} 创建的Warp`)
    .addInput('X坐标', strX, strX)
    .addInput('Y坐标', strY, strY)
    .addInput('Z坐标', strZ, strZ)
    .addDropdown('维度', ['主世界', '地狱', '末地'], dimId_)
    .addInput('Warp简介');
  pl_.sendForm(form, (pl, data) => {
    if (data) {
      const [name, x, y, z, dimId, desc] = data;

      if (!name) {
        pl.tell(`${Red}请输入合法内容`);
        return;
      }

      const pos = {
        x: x ? Number(x) : x_,
        y: y ? Number(y) : y_,
        z: z ? Number(z) : z_,
        dimId,
      };
      const obj = getWarpObj(pl, pos, name, desc);

      const warps = getWarpConf();
      warps.push(obj);
      setWarpConf(warps);

      pl.tell(
        `${Green}创建Warp ${MinecoinGold}${name} ${Green}成功！\n` +
          `坐标：${formatPos(pos)}`
      );
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

function compareObject(obj1, obj2) {
  return JSON.stringify(obj1) === JSON.stringify(obj2);
}

function deleteWarp(pl, warpObj) {
  const { name, pos } = warpObj;
  confirmBox(
    pl,
    `真的要删除Warp ${Bold}${MinecoinGold}${name}${Clear}` +
      `(${formatPos(pos)}${Clear}) 吗？`,
    () => {
      const conf = getWarpConf();
      const index = conf.findIndex((x) => compareObject(x, warpObj));
      if (index === -1) {
        pl.tell(`${Red}Warp不存在！`);
        return;
      }
      conf.splice(index, 1);
      setWarpConf(conf);

      pl.tell(
        `${Green}已删除Warp ${MinecoinGold}${name}\n` +
          `${Green}坐标： ${formatPos(pos)}`
      );
    }
  );
}

function deleteWarpForm(pl_) {
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
      deleteWarp(pl, warp);
    }
  });
}

function warpList(pl) {
  function warpDetail(pl_, warp) {
    const {
      player: { name: playerName, xuid },
      pos,
      name,
      date,
      desc,
    } = warp;

    const isOwner = pl_.xuid === xuid || pl.permLevel > 0;

    let form = mc
      .newSimpleForm()
      .setTitle('Warp详情')
      .setContent(
        `- ${DarkGreen}名称： ${Bold}${Green}${name}${Clear}\n` +
          `- ${DarkGreen}创建者： ` +
          `${Bold}${Green}${playerName}${Clear}${Green}（${xuid}）${Clear}\n` +
          `- ${DarkGreen}坐标： ${Bold}${formatPos(pos)}${Clear}\n` +
          `- ${DarkGreen}创建日期： ` +
          `${Bold}${Green}${formatDate(new Date(date))}${Clear}\n` +
          `- ${DarkGreen}简介： ${Bold}${Green}${desc || '无'}`
      )
      .addButton(`${DarkGreen}导航`);

    if (isOwner) form = form.addButton(`${DarkGreen}删除`);
    form = form.addButton(`${DarkGreen}返回Warp列表`);

    pl_.sendForm(form, (pl__, id) => {
      if (id !== undefined && id !== null) {
        switch (id) {
          case 0: {
            const { xuid: xuidP } = pl__;
            if (hasNavigationTask(xuidP)) clearNavigationTask(xuidP);
            newNavigationTask(xuidP, warp);
            break;
          }
          case 1:
            if (isOwner) {
              deleteWarp(pl, warp);
              break;
            }
          // fallthrough
          case 2:
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
      .setTitle('Warp管理')
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
            deleteWarpForm(pl);
            break;
          case 2:
            clearNavigationTask(pl.xuid);
            break;
          default:
        }
      }
    }
  );
}

(() => {
  const cmd = mc.newCommand('warpmanage', '管理Warp', PermType.Any);
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
})();

(() => {
  const cmd = mc.newCommand('warplist', '查看Warp', PermType.Any);
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
})();

(() => {
  const oldConfDir = `plugins/EveryoneWrap`;
  const oldConfPath = `${oldConfDir}/warps.json`;

  if (File.exists(oldConfPath)) {
    setWarpConf(new JsonConfigFile(oldConfPath).get('wraps'));
    File.rename(oldConfPath, `${confDir}/warps_old.json`);
    logger.info('旧的插件数据迁移完毕');
  }
})();

ll.registerPlugin(pluginName, '公共坐标点', [0, 2, 1], {
  Author: 'student_2333',
  License: 'Apache-2.0',
});
