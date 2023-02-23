/* eslint-disable no-restricted-syntax */
/* global ll JsonConfigFile logger mc data Format network PermType ParamType */
// LiteLoaderScript Dev Helper
/// <reference path="d:\Coding\bds\LLSEAids/dts/llaids/src/index.d.ts"/>

const pluginName = 'LLBlackBEEx';
const pluginVersion = [0, 2, 0];
const {
  Red,
  DarkGreen,
  Green,
  Aqua,
  LightPurple,
  MinecoinGold,
  Gold,
  Yellow,
  Bold,
  Clear,
} = Format;

const config = new JsonConfigFile(`plugins/${pluginName}/config.json`);
const apiToken = config.init('apiToken', '');
const banIp = config.init('banIp', true);
const hidePassMessage = config.init('hidePassMessage', false);
const disableBlackBE = config.init('disableBlackBE', false);
const kickByLocalMsg = config.init(
  'kickByLocalMsg',
  `${Red}您已被服务器封禁${Clear}\\n\\n` +
    `解封时间: ${MinecoinGold}%ENDTIME%${Clear}\\n封禁原因:${MinecoinGold} %REASON%`
);
const kickByCloudMsg = config.init(
  'kickByCloudMsg',
  `${Red}您已被BlackBE云端黑名单封禁${Clear}\\n\\n` +
    `详情请访问 ${Gold}https://blackbe.xyz/`
);
const useMirrorBlackBEUrl = config.init('useMirrorBlackBEUrl', false);

const BLACKBE_API_PREFIX = `https://${
  useMirrorBlackBEUrl ? 'blackbe.lgc2333.top' : 'api.blackbe.work'
}/openapi/v3/`;

const localBlacklist = new JsonConfigFile(
  `plugins/${pluginName}/local_list.json`
);
localBlacklist.init('list', []);

logger.setTitle(pluginName);
logger.setConsole(true);
logger.setFile(`./logs/${pluginName}.log`, 4);
// logger.setLogLevel(5);

const privRespName = new Map([['1', '公有库']]);

/**
 * @returns {Array<Object>}
 */
function getLocalBlacklist() {
  return localBlacklist.get('list');
}

function setLocalBlacklist(li) {
  return localBlacklist.set('list', li);
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

/**
 * @returns {String}
 */
function getLocalKickMsg(banData) {
  const { reason, endTime } = banData;
  return kickByLocalMsg
    .replace(/%REASON%/g, reason || '被管理员封禁')
    .replace(/%ENDTIME%/g, endTime ? formatDate(new Date(endTime)) : '永久');
}

function formatLocalBanInfo(data, hasColor = false) {
  /* 
    banData:
    {
      name: String
      xuid: String,
      ip: String,
      endTime: String, // Date.toJson()
      reason: String,
    }
  */
  function c(color) {
    return hasColor ? color : '';
  }

  function formatEndT(t) {
    return t ? formatDate(new Date(t)) : '永久';
  }

  const { name, xuid, ip, endTime, reason } = data;
  return (
    `${c(DarkGreen)}玩家名称${c(Clear)}： ` +
    `${c(Bold)}${c(LightPurple)}${name}${c(Clear)}\n` +
    `${c(DarkGreen)}XUID${c(Clear)}： ${c(Aqua)}${xuid || '无'}\n` +
    `${c(DarkGreen)}IP地址${c(Clear)}： ${c(Aqua)}${ip || '无'}\n` +
    `${c(DarkGreen)}截止时间${c(Clear)}： ${c(Aqua)}${formatEndT(endTime)}\n` +
    `${c(DarkGreen)}封禁理由${c(Clear)}： ${c(Aqua)}${reason || '无'}` +
    `${c(Clear)}`
  );
}

/**
 * 格式化API返回值
 * @param {Object} data
 */
function parseAPIReturn(data) {
  const {
    level,
    name,
    info,
    xuid,
    qq,
    uuid,
    server,
    phone,
    time,
    black_id: blackId,
  } = data;
  const [lvl, color] = (() => {
    switch (level) {
      case 1:
        return ['有作弊行为，但未对其他玩家造成实质上损害', Yellow];
      case 2:
        return ['有作弊行为，且对玩家造成一定的损害', Gold];
      case 3:
        return ['严重破坏服务器，对玩家和服务器造成较大的损害', Red];
      default:
        return ['未知', Clear];
    }
  })();
  return (
    `${DarkGreen}玩家ID${Clear}： ${Bold}${LightPurple}${name}${Clear}\n` +
    `${DarkGreen}危险等级${Clear}： ${color}等级 ${Bold}${level} ${Clear}${color}（${lvl}）\n` +
    `${DarkGreen}记录原因${Clear}： ${Aqua}${info}\n` +
    `${server ? `${DarkGreen}违规服务器${Clear}： ${Aqua}${server}\n` : ''}` +
    `${DarkGreen}XUID${Clear}： ${Aqua}${xuid}\n` +
    `${DarkGreen}玩家QQ${Clear}： ${Aqua}${qq}\n` +
    `${phone ? `${DarkGreen}玩家电话${Clear}： ${Aqua}${phone}\n` : ''}` +
    `${time ? `${DarkGreen}记录时间${Clear}： ${Aqua}${time}\n` : ''}` +
    `${DarkGreen}记录UUID${Clear}： ${Aqua}${uuid}\n` +
    `${DarkGreen}来源库${Clear}： ` +
    `${Aqua}${privRespName.get(blackId) || '未知'} （${blackId}）`
  );
}

/**
 * ip去端口号
 * @param {String} ip
 */
function stripIp(ip) {
  return ip.split(':')[0];
}

/**
 * 检查本地黑名单
 * @returns {Object | null}
 */
function checkPlayerLocal(pl) {
  const { realName: pName, xuid: pXuid, ip: pIp } = pl;
  for (const i of getLocalBlacklist()) {
    const { name, xuid, ip } = i;
    if (name === pName || xuid === pXuid || (banIp && ip === stripIp(pIp))) {
      return i;
    }
  }
  return null;
}

/**
 * 添加本地黑名单
 * @param {String} name
 * @param {Number} minutes
 * @param {String} reason
 * @returns {Object | Boolean} true: success, false: playerNotExist, object: update
 */
function banPlayerLocal(name_, reason, minutes) {
  const pl = mc.getPlayer(name_);
  const banData = {
    name: name_,
    xuid: null,
    ip: null,
    endTime: minutes
      ? new Date(Date.now() + 1000 * 60 * minutes).toJSON()
      : null,
    reason,
  };
  if (pl) {
    const { realName, xuid, ip } = pl;
    banData.name = realName;
    banData.xuid = xuid;
    banData.ip = stripIp(ip);
    setTimeout(() => {
      pl.kick(getLocalKickMsg(banData));
    }, 0);
  } else {
    const xuid = data.name2xuid(name_);
    banData.xuid = xuid;
  }

  const { name, xuid } = banData;
  let ret = true;

  const dataList = getLocalBlacklist();
  const indexName = dataList.findIndex((i) => i.name === name);
  const indexXuid = xuid ? dataList.findIndex((i) => i.xuid === xuid) : -1;

  // eslint-disable-next-line prefer-destructuring
  if (indexName !== -1) ret = dataList.splice(indexName, 1)[0];
  // eslint-disable-next-line prefer-destructuring
  else if (indexXuid !== -1) ret = dataList.splice(indexXuid, 1)[0];

  dataList.push(banData);
  setLocalBlacklist(dataList);
  return ret;
}

/**
 * 本地黑名单解封
 * @param {String} name
 * @returns {Boolean}
 */
function unbanPlayerLocal(name) {
  const dataList = getLocalBlacklist();
  const index = dataList.findIndex((i) => i.name === name);

  if (index !== -1) {
    dataList.splice(index, 1);
    setLocalBlacklist(dataList);
    return true;
  }
  return false;
}

/**
 * 本地黑名单列表
 * @returns {String}
 */
function listBanLocal(hasColor = false) {
  const dataList = getLocalBlacklist();
  if (dataList.length === 0)
    return `${hasColor ? Red : ''}本地黑名单列表为空。`;

  const tmpLi = [`${hasColor ? Green : ''}本地黑名单列表如下：${Clear}`];
  dataList.forEach((i) => tmpLi.push(formatLocalBanInfo(i, hasColor)));
  return tmpLi.join('\n-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-\n');
}

/**
 * 格式化返回数据，返回结果文本
 * @param {String} query
 * @param {Object} retOpen
 * @param {Object} retPriv
 * @returns
 */
function parseResult(query, retOpen, retPriv) {
  const results = [];
  const msg = [];
  if (!retOpen.success) {
    const { status, message } = retOpen;
    msg.push(
      `${Gold}提示： 查询公有库失败${Clear}：[${Gold}${status}${Clear}] ${LightPurple}${message}`
    );
  } else {
    results.push(...retOpen.data.info);
  }

  if (Object.keys(retPriv) === 0 || retPriv.success === false) {
    const { status, message } = retPriv;
    msg.push(
      `${Gold}提示： 查询私有库失败${Clear}：[${Gold}${status}${Clear}] ${LightPurple}${message}`
    );
  } else {
    const { data } = retPriv;
    if (data) {
      data.forEach((it1) => {
        const { repo_success: success, repo_uuid: uuid, info } = it1;
        if (!success) {
          msg.push(
            `${Gold}提示： 查询私有库 ${LightPurple}${uuid} ${Gold}失败`
          );
          return;
        }
        info.forEach((it) => {
          const r = it;
          r.black_id = uuid;
          results.push(r);
        });
      });
    }
  }

  if (results.length > 0) {
    msg.push(
      `${Green}为您查询到关于 ${Bold}${DarkGreen}${query} ${Clear}${Green}的 ${Bold}${Yellow}${results.length} ${Clear}${Green}条相关记录：`
    );
    results.forEach((i) => {
      msg.push(`${Clear}-=-=-=-=-=-=-=-=-=-=-=-=-=-`, parseAPIReturn(i));
    });
  } else {
    msg.push(
      `${Green}没有找到关于 ${Bold}${DarkGreen}${query} ${Clear}${Green}的相关记录`
    );
  }

  return msg.join('\n');
}

/**
 * @param {String} url
 * @returns {Promise}
 */
function asyncHttpGet(url, noAuth = false) {
  const header = {};
  if (!noAuth) header.authorization = `Bearer ${apiToken}`;
  return new Promise((resolve) => {
    network.httpGet(url, header, (code, resp) => resolve({ code, resp }));
  });
}

/**
 * @param {String} url
 * @param {String} data
 * @param {Object} headers
 * @param {String} type
 * @returns {Promise}
 */
function asyncHttpPost(url, data, noAuth = false, type = 'application/json') {
  const header = {};
  if (!noAuth) header.authorization = `Bearer ${apiToken}`;
  return new Promise((resolve) => {
    network.httpPost(url, header, data, type, (code, resp) =>
      resolve({ code, resp })
    );
  });
}

/**
 * 向主线程扔出错误，promise catch用
 * @param {Error} e
 */
function throwError(e) {
  setTimeout(() => {
    throw e;
  }, 0);
}

/**
 * 查询简略信息，进服检测用
 * @param {String} name
 * @param {(code:Number,result:Object)} callback
 * @param {String | Number} qq
 * @param {String} xuid
 */
function simpleCheck(name, callback, qq = null, xuid = null) {
  const methodName = 'check/';
  const encName = encodeURIComponent(name);
  const params = `?name=${encName}&qq=${qq || encName}&xuid=${xuid || encName}`;
  asyncHttpGet(`${BLACKBE_API_PREFIX}${methodName}${params}`)
    .then((r) => {
      const { code, resp } = r;
      logger.debug(code);
      logger.debug(resp);
      callback(code, JSON.parse(resp));
    })
    .catch(throwError);
}

/**
 * 查询详细信息，返回格式化带颜色代码文本，游戏内查询用
 * @param {String} name
 * @param {(result:String)=>} callback
 */
function fullCheckMsg(name, callback) {
  const queryRespUrl = `${BLACKBE_API_PREFIX}private/repositories/list`;
  const queryOpenUrl = `${BLACKBE_API_PREFIX}check/`;
  const queryPrivateUrl = `${BLACKBE_API_PREFIX}check/private/`;

  const encName = encodeURIComponent(name);
  const params = `?name=${encName}&qq=${encName}&xuid=${encName}`;

  (async () => {
    const respLi = [];
    let resp;
    let retPriv = {};

    if (apiToken) {
      resp = (await asyncHttpGet(queryRespUrl)).resp;
      logger.debug(resp);
      const retResp = JSON.parse(resp);
      const repoLi = retResp.data.repositories_list;
      if (repoLi) {
        repoLi.forEach((it) => {
          const { uuid, name: name_ } = it;
          privRespName.set(uuid, name_);
          respLi.push(uuid);
        });
      }

      if (respLi.length > 0) {
        resp = (
          await asyncHttpPost(
            `${queryPrivateUrl}${params}`,
            JSON.stringify({ repositories_uuid: respLi })
          )
        ).resp;
        logger.debug(resp);
        retPriv = JSON.parse(resp);
      }
    }

    resp = (await asyncHttpGet(`${queryOpenUrl}${params}`, true)).resp;
    logger.debug(resp);
    const retOpen = JSON.parse(resp);

    callback(parseResult(name, retOpen, retPriv));
  })().catch((e) => callback(`${Red}出错了！\n${e.stack}`));
}

/**
 * 发送查询结果表单
 * @param {Player} pl 玩家
 * @param {string} query 查询内容
 */
function formResult(pl, rawQuery) {
  const query = rawQuery.trim();
  fullCheckMsg(query, (c) => {
    pl.sendForm(
      mc
        .newSimpleForm()
        .setTitle(`${Aqua}${pluginName}${Clear} - ${Green}Query Result`)
        .setContent(c),
      () => {}
    );
  });
}

/**
 * 发送查询输入表单
 * @param {Player} pl
 */
function formQuery(player) {
  player.sendForm(
    // eslint-disable-next-line no-undef
    mc
      .newCustomForm()
      .setTitle(`${Aqua}${pluginName}${Clear} - ${Green}Query`)
      .addLabel(`${Green}请输入查询内容`)
      .addLabel(
        `${Gold}请谨慎使用XUID查询：由于历史遗留和XUID采集本身存在难度，` +
          '导致大部分条目没有记录XUID，所以不推荐依赖XUID来判断玩家是否存在于黑名单'
      )
      .addInput('', 'XboxID/QQ号/XUID'),
    (pl, ret) => {
      if (ret && ret[2]) {
        formResult(pl, ret[2]);
      } else {
        pl.sendText(`${Red}请输入查询内容`);
      }
    }
  );
}

/**
 * 管理员主面板
 * @param {Player} player
 */
function formManage(player) {
  player.sendSimpleForm(
    `${Aqua}${pluginName}${Clear} - ${Green}Manage`,
    `${Aqua}请选择操作`,
    ['封禁', '查看本地黑名单'],
    ['', ''],
    (pl, id) => {
      if (id == null) {
        pl.sendText('您已成功退出');
      } else if (id === 0) {
        // eslint-disable-next-line no-use-before-define
        formBan(pl);
      } else if (id === 1) {
        // eslint-disable-next-line no-use-before-define
        formBanList(pl);
      }
    }
  );
}

/**
 * 封禁选择表单
 * @param {Player} player
 */
function formBan(player) {
  const playerNameList = [];
  for (const i of mc.getOnlinePlayers()) {
    playerNameList.push(i.name);
  }
  player.sendSimpleForm(
    `${Aqua}${pluginName}${Clear} - ${Green}Manage`,
    `${Aqua}请选择要封禁的玩家`,
    playerNameList,
    new Array(playerNameList.length).fill(''),
    (pl, id) => {
      if (id == null) {
        formManage(pl);
      } else {
        // eslint-disable-next-line no-use-before-define
        formBanConfirm(pl, playerNameList[id]);
      }
    }
  );
}

/**
 * 封禁信息/确认表单
 * @param {Player} player
 */
function formBanConfirm(player, name) {
  player.sendForm(
    mc
      .newCustomForm()
      .setTitle(`${Aqua}${pluginName}${Clear} - ${Green}Manage`)
      .addLabel(`您正在封禁玩家 ：${name}`)
      .addInput('封禁时长', '数字(永久封禁请忽视本参数)')
      .addStepSlider('时间单位', ['分', '时', '日', '永久封禁'], 1)
      .addInput('封禁原因'),
    (pl, ret) => {
      if (ret == null) {
        formBan(pl);
        return;
      }
      let time = 0;
      let showtime;
      if (ret[2] === 0) {
        time = ret[1] * 1;
      }
      if (ret[2] === 1) {
        time = ret[1] * 60;
      }
      if (ret[2] === 2) {
        time = ret[1] * 1440;
      }
      if (ret[2] === 3) {
        showtime = '永久封禁';
        time = null;
      } else {
        showtime = `${time}分`;
      }
      pl.sendModalForm(
        '封禁确认',
        `玩家名:${name}\n封禁时长:${showtime}`,
        '确认封禁',
        '取消',
        (pl_, confirm) => {
          if (confirm) {
            if (banPlayerLocal(name, ret[3], time)) {
              pl_.sendText(`${Green}已成功将玩家 ${name} 加入本地黑名单`);
            } else {
              pl_.sendText(`${Red}玩家 ${name} 已存在于本地黑名单`);
            }
          } else {
            formBan(pl_);
          }
        }
      );
    }
  );
}

/**
 * 本地封禁列表
 * @param {Player} player
 */
function formBanList(player) {
  function formatEndT(t) {
    return t ? formatDate(new Date(t)) : '永久';
  }

  const dataList = getLocalBlacklist();
  const form = mc.newSimpleForm();
  form.setTitle(`${Aqua}${pluginName}${Clear} - ${Green}Manage`);
  for (const i of dataList) {
    form.addButton(`${i.name}\n${formatEndT(i.endTime)}`);
  }
  player.sendForm(form, (pl, id) => {
    if (id == null) {
      formManage(pl);
    } else {
      // eslint-disable-next-line no-use-before-define
      formLocalBanInfo(player, dataList[id]);
    }
  });
}

/**
 * 展示详细信息 解封 修改
 * @param {Player} player
 * @param {*} banData
 */
function formLocalBanInfo(player, banData) {
  player.sendSimpleForm(
    `${Aqua}${pluginName}${Clear} - ${Green}Manage`,
    formatLocalBanInfo(banData, true),
    ['修改', '解封'],
    ['', ''],
    (pl, id) => {
      if (id == null) {
        formBanList(pl);
      } else if (id === 0) {
        // eslint-disable-next-line no-use-before-define
        formChange(pl, banData);
      } else if (id === 1) {
        unbanPlayerLocal(banData.name);
      }
    }
  );
}

/**
 * 更新封禁信息
 * @param {Player} player
 * @param {*} banData
 */
function formChange(player, banData) {
  const lefttime = banData.endTime
    ? Math.round(
        (new Date(banData.endTime).getTime() - new Date().getTime()) / 60000
      ).toString()
    : '';
  player.sendForm(
    mc
      .newCustomForm()
      .setTitle(`${Aqua}${pluginName}${Clear} - ${Green}Manage`)
      .addLabel(`您正在更改玩家 ：${banData.name} 的封禁信息`)
      .addInput('封禁时长', '数字(永久封禁请忽视本参数)', lefttime)
      .addStepSlider(
        '时间单位',
        ['分', '时', '日', '永久封禁'],
        lefttime === '' ? 3 : 0
      )
      .addInput('封禁原因', '', banData.reason),
    (pl, ret) => {
      if (ret == null) {
        formLocalBanInfo(pl);
        return;
      }
      let time = 0;
      let showtime;
      if (ret[2] === 0) {
        time = ret[1] * 1;
      }
      if (ret[2] === 1) {
        time = ret[1] * 60;
      }
      if (ret[2] === 2) {
        time = ret[1] * 1440;
      }
      if (ret[2] === 3) {
        showtime = '永久封禁';
        time = null;
      } else {
        showtime = `${time}分`;
      }
      pl.sendModalForm(
        '确认修改',
        `玩家名:${banData.name}\n封禁时长:${showtime}`,
        '确认修改',
        '取消',
        (pl_, confirm) => {
          if (confirm) {
            if (banPlayerLocal(banData.name, ret[3], time)) {
              pl_.sendText(`${Green}已成功修改玩家 ${banData.name} 的封禁信息`);
            } else {
              pl_.sendText(`${Red}玩家 ${banData.name} 封禁信息修改失败`);
            }
          } else {
            formChange(pl_);
          }
        }
      );
    }
  );
}

// 自动解ban
(() => {
  function task() {
    const blackList = getLocalBlacklist();
    blackList.forEach((it, i) => {
      const { endTime, name } = it;
      if (new Date(endTime) <= new Date()) {
        const msg = `玩家 ${name} 的黑名单封禁到期，已自动解封`;
        mc.broadcast(`${Green}${msg}`);
        logger.warn(msg);
        blackList.splice(i, 1);
        setLocalBlacklist(blackList);
      }
    });
  }
  mc.listen('onServerStarted', () => {
    setInterval(task, 60000);
    task(); // 开服先运行一遍，Interval不会立即执行
  });
})();

/**
 * 去两侧引号
 * @param {String} str
 */
function trimQuote(str) {
  if (str && str.startsWith('"') && str.endsWith('"'))
    return str.slice(1, str.length - 1);
  return str;
}

(() => {
  const cmd = mc.newCommand('ban', '本地封禁玩家', PermType.GameMasters);
  cmd.mandatory('name', ParamType.String);
  cmd.optional('reason', ParamType.String);
  cmd.optional('duration', ParamType.Int);
  cmd.overload(['name', 'reason', 'duration']);
  cmd.setCallback((_, __, out, res) => {
    const { name, reason, duration } = res;
    const nameStrip = trimQuote(name);
    const ret = banPlayerLocal(nameStrip, trimQuote(reason), duration);
    if (ret) {
      if (ret instanceof Object) {
        return out.success(
          `${Green}玩家 ${nameStrip} 的封禁信息已成功更新\n` +
            `旧封禁信息：\n${formatLocalBanInfo(ret, true)}`
        );
      }
      return out.success(`${Green}已成功将玩家 ${nameStrip} 加入本地黑名单`);
    }
    out.error(`${Red}玩家 ${nameStrip} 已存在于本地黑名单`);
    return false;
  });
  cmd.setup();
})();

(() => {
  const cmd = mc.newCommand('unban', '本地解封玩家', PermType.GameMasters);
  cmd.mandatory('name', ParamType.RawText);
  cmd.overload(['name']);
  cmd.setCallback((_, __, out, res) => {
    const { name } = res;
    const nameStrip = trimQuote(name);
    const ret = unbanPlayerLocal(nameStrip);
    if (ret) {
      return out.success(`${Green}已成功将玩家 ${nameStrip} 从本地黑名单移除`);
    }
    out.error(`${Red}本地黑名单不存在玩家 ${nameStrip}`);
    return false;
  });
  cmd.setup();
})();

(() => {
  const cmd = mc.newCommand(
    'banlist',
    '查询本地黑名单列表',
    PermType.GameMasters
  );
  cmd.overload([]);
  cmd.setCallback((_, __, out) => out.success(listBanLocal(true)));
  cmd.setup();
})();

(() => {
  const cmd = mc.newCommand('blackbe', '查询玩家BlackBE云黑记录', PermType.Any);
  cmd.optional('name', ParamType.RawText);
  cmd.overload(['name']);
  cmd.setCallback((_, ori, out, res) => {
    const { name } = res;
    const nameStrip = trimQuote(name);

    if (!ori.player) {
      out.error(`${Red}控制台无法执行此命令`);
      return false;
    }

    if (nameStrip) formResult(ori.player, nameStrip);
    else formQuery(ori.player);
    return true;
  });
  cmd.setup();
})();

(() => {
  const cmd = mc.newCommand(
    'blacklistgui',
    '黑名单GUI',
    PermType.GameMasters,
    0x80,
    'mgrgui'
  );
  cmd.overload([]);
  cmd.setCallback((_, ori, out) => {
    if (!ori.player) {
      out.error(`${Red}控制台无法执行此命令`);
      return false;
    }
    formManage(ori.player);
    return true;
  });
  cmd.setup();
})();

mc.listen('onJoin', (pl) => {
  if (pl.isSimulatedPlayer()) return;

  const { realName, xuid } = pl;
  if (!hidePassMessage) logger.info(`正在对玩家 ${realName} 进行黑名单检测……`);

  const banData = checkPlayerLocal(pl);
  if (banData) {
    setTimeout(() => {
      pl.kick(getLocalKickMsg(banData));
    }, 0);
    logger.warn(`检测到玩家 ${realName} 存在本地封禁记录，已踢出`);
    return;
  }
  if (!hidePassMessage) logger.info(`对玩家 ${realName} 的本地黑名单检测通过`);

  if (!disableBlackBE)
    simpleCheck(
      realName,
      (_, ret) => {
        if (ret.data.exist) {
          setTimeout(() => {
            pl.kick(kickByCloudMsg);
          }, 0);
          logger.warn(`检测到玩家 ${realName} 存在云端封禁记录，已踢出`);
          return;
        }
        if (!hidePassMessage)
          logger.info(`对玩家 ${realName} 的云端黑名单检测通过`);
      },
      null,
      xuid
    );
});

ll.registerPlugin(pluginName, 'BlackBE云黑插件Ex', pluginVersion, {
  Author: 'student_2333',
  License: 'Apache-2.0',
});

logger.info(
  '======================================================================'
);
logger.info(
  `                    插件已装载！当前版本：${pluginVersion.join('.')}`
);
logger.info(
  `插件作者： student_2333                     开源证书：      Apache-2.0`
);
logger.info(
  `原作者：      yqs112358                     发布平台：MineBBS & Github`
);
logger.info(
  `开源地址：https://github.com/lgc2333/LLSEPlugins/tree/main/${pluginName}`
);
logger.info(
  '======================================================================'
);
