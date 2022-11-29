/* global JsonConfigFile WSClient mc ll logger Format */

// LiteLoaderScript Dev Helper
/// <reference path="d:\Coding\LLSEAids/dts/llaids/src/index.d.ts"/>

// 控制台颜色控制符
const conGreen = '\u001b[0;32m';
// const conWhite = '\u001b[0;37m';
const conYellow = '\u001b[0;33m';
const conRed = '\u001b[0;31m';
// const conBlue = '\u001b[0;34m'; // 太暗了
const conMagenta = '\u001b[0;35m';
const conCyan = '\u001b[0;36m';
const conReset = '\u001b[0m';

const config = new JsonConfigFile('plugins/GoCQSync/config.json');
config.init('ws_url', 'ws://127.0.0.1:6700');
config.init('superusers', ['']);
config.init('enable_groups', ['']);
config.init('log_level', 4);
config.init('cmd_prefix', '/');
config.init('cmd_status', '查询');
config.init('allow_cmd', ['^list$']);

const ws = new WSClient();
const reqCache = new Map();
// let detectTaskId;

logger.setTitle(`GoCQSync`);
logger.setLogLevel(config.get('log_level'));

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
 * 向主线程抛出error
 * @param {Error} e error
 */
function throwError(e) {
  setTimeout(() => {
    throw e;
  }, 0);
}

/**
 * 向GoCQ发送数据
 * @param {object} data
 */
function sendData(data) {
  if (!ws.send(JSON.stringify(data))) {
    logger.error('向GoCQ发送数据失败！');
    throw new Error('发送数据失败');
  }
}

/**
 * 调用GoCQ API
 * @param {string} name
 * @param {object} data
 * @param {(data:object)void} callback
 */
function callAPI(name, data, callback = () => {}) {
  const echo = new Date().getTime().toString();
  const echoColor = `\u001b[0;${getRandomInt(31, 36)}m`; // 随机前景色
  const logStart = `调用API"${conGreen}${name}${conReset}"，echo=${echoColor}${echo}${conReset}，`;

  logger.debug(`${logStart}等待返回数据`);
  try {
    sendData({ action: name, params: data, echo });
  } catch {
    callback(undefined);
    logger.debug(`${logStart}${conRed}失败`);
  }

  const checkFunc = () => {
    const ret = reqCache.get(echo);
    if (ret !== undefined) {
      logger.debug(`${logStart}已返回数据：${conGreen}${JSON.stringify(ret)}`);
      reqCache.delete(echo);
      callback(ret);
    } else {
      setTimeout(checkFunc, 0); // async
    }
  };
  checkFunc();
}

/**
 * 发送群消息
 * @param {number} groupId
 * @param {string|Array<object>} message
 * @param {boolean} autoEscape 是否自动转CQ码
 * @param {Function} callback
 */
function sendGroupMsg(
  groupId,
  message,
  autoEscape = false,
  callback = () => {}
) {
  return callAPI(
    'send_group_msg',
    {
      group_id: groupId,
      message,
      auto_escape: autoEscape,
    },
    callback
  );
}

/**
 * 获取bot运行状态
 * @param {Function} callback
 */
/*
function getStatus(callback = () => {}) {
  return callAPI('get_status', {}, callback);
}
*/

/**
 * 向所有启用群发消息
 * @param {string|Array<object>} msg
 * @param {boolean} autoEscape 是否自动转CQ码
 */
function sendToAllEnableGroups(msg, autoEscape = false) {
  config.get('enable_groups').forEach((g) => {
    sendGroupMsg(Number(g), msg, autoEscape);
  });
}

/**
 * 消息text转array
 * @param {string} msg
 */
function text2Array(msg) {
  /**
   * CQCode Object
   * @param {string} type
   * @param {object} data
   */
  function getCodeObj(type, data) {
    return { type, data };
  }

  // https://github.com/nonebot/adapter-onebot/blob/master/nonebot/adapters/onebot/v11/message.py#L301
  const cqRegex = /\[CQ:([a-zA-Z0-9-_.]+)((?:,[a-zA-Z0-9-_.]+=[^,\]]*)*),?\]/gu;

  const tmp = [];
  let lastRightBracket = 0;
  for (;;) {
    const { lastIndex } = cqRegex;
    const result = cqRegex.exec(msg);
    // let msg='123[CQ:test],456[CQ:tteesstt,a=1,b=a]'
    // ['[CQ:tteesstt,a=1,b=a]', 'tteesstt', ',a=1,b=a', index: 16, input: '123[CQ:test],456[CQ:tteesstt,a=1,b=a]', groups: undefined]

    if (result) {
      const { index, 0: raw, 1: type, 2: dataRaw } = result;

      if (index > 0 && lastIndex !== index)
        tmp.push(getCodeObj('text', { text: msg.substring(lastIndex, index) }));

      const data = {};
      const dataArr = dataRaw.split(',');
      dataArr.shift(); // ['a=1', 'b=a']
      dataArr.forEach((it) => {
        const [x, y] = it.split('=');
        data[x] = y;
      });

      tmp.push(getCodeObj(type, data));
      lastRightBracket = index + raw.length;
    } else {
      break;
    }
  }

  const tail = msg.substring(lastRightBracket);
  if (tail) tmp.push(getCodeObj('text', { text: tail }));

  return tmp;
}

/**
 * 消息object转文本
 * @param {Array<object>} msg
 * @param {string} head 特殊消息格式化时左侧文本
 * @param {string} tail 特殊消息格式化时右侧文本
 */
function messageObjectToString(
  msg,
  head = `${Format.Aqua}[`,
  tail = `]${Format.Clear}`
) {
  /**
   * 给文字两头加上文本（处理特殊消息格式化）
   * @param {string} t text
   */
  function addHeadAndTail(t) {
    return `${head}${t}${tail}`;
  }

  return msg
    .map((i) => {
      let txt;
      switch (i.type) {
        case 'text':
          return i.data.text;
        case 'face':
          txt = '表情';
          break;
        case 'record':
          txt = `${i.data.magic === '1' ? '变声' : ''}语音`;
          break;
        case 'video':
          txt = '视频';
          break;
        case 'at':
          txt = `@${i.data.qq}`;
          break;
        case 'rps':
          txt = '猜拳';
          break;
        case 'dice':
          txt = '骰子';
          break;
        case 'share': {
          const { title, url } = i.data;
          txt = `分享：${title}（${url}）`;
          break;
        }
        case 'contact': {
          const { type, id } = i.data;
          txt = `推荐${type === 'qq' ? '联系人' : '群聊'}：${id}`;
          break;
        }
        case 'location': {
          const {
            lat, // 纬度
            lon, // 经度
          } = i.data;
          txt = `位置：${lon}, ${lat}`;
          break;
        }
        case 'image':
          txt = i.data.subType === '1' ? '动画表情' : '图片';
          break;
        case 'reply':
          txt = '回复';
          break;
        case 'redbag':
          txt = `红包：${i.data.title}`;
          break;
        case 'forward':
          txt = '合并转发';
          break;
        case 'xml': // fallthrough
        case 'json':
          txt = '卡片消息';
          break;
        default:
          txt = '特殊消息';
          break;
      }
      return addHeadAndTail(txt);
    })
    .join('');
}

/**
 * 消息object提取纯文本
 * @param {Array<object>} msg
 */
function messageObjectExtractString(msg) {
  return msg
    .map((it) => {
      if (it.type === 'text') {
        return it.data.text;
      }
      return '';
    })
    .join('');
}

/**
 * 获取服务器状态
 * @returns {string}
 */
function getServerStat() {
  const playerLi = mc.getOnlinePlayers();
  return `
游戏版本：${mc.getBDSVersion()}
协议版本：${mc.getServerProtocolVersion()}
LL版本：${ll.versionString()}
插件数量：${ll.listPlugins().length}
玩家列表（共 ${playerLi.length} 人）：
${playerLi
  .map((p) => {
    const dv = p.getDevice();
    return `${p.realName} | ${dv.os} | ${dv.avgPing}ms(${dv.avgPacketLoss}% loss)`;
  })
  .join('\n')}
`.trim();
}

/**
 * @param {string} cmd
 * @returns {boolean}
 */
function isAllowedCmd(cmd) {
  const allowed = config.get('allow_cmd');
  for (const reg of allowed) {
    if (RegExp(reg).test(cmd)) return true;
  }
  return false;
}

/**
 * 群消息处理
 * @param {object} ev
 */
function processGroupMsg(ev) {
  const {
    self_id: selfId,
    user_id: userId,
    // raw_message: rawMessage,
    group_id: groupId,
    sender: { nickname, card },
  } = ev;
  let { message } = ev;

  /**
   * 往来源群聊发送消息
   * @param {string|Array<object>} msg
   * @param {boolean} autoEscape 是否自动转CQ码
   */
  function fastReply(msg, autoEscape = false) {
    sendGroupMsg(groupId, msg, autoEscape);
  }

  if (!(message instanceof Array)) message = text2Array(message);
  const txtMsg = messageObjectExtractString(message);

  // log输出
  const nick = card === '' ? nickname : card;
  const userColor = userId === selfId ? conGreen : conYellow;
  logger.info(
    `${conMagenta}Group ${groupId}${conReset} -> ` +
      `${userColor}${nick}（${userId}）${conReset}：` +
      `${messageObjectToString(message, `${conCyan}[`, `]${conReset}`)}`
  );

  if (userId !== selfId) {
    // 群聊信息转服务器
    const { Gold, Green, Gray, LightPurple, Bold, Clear } = Format;
    mc.broadcast(
      `${LightPurple}${Bold}[群聊]${Clear} ` +
        `${Green}${nick}${Gold}（${userId}）${Gray}： ` +
        `${Clear}${messageObjectToString(message)}`
    );

    // 执行指令
    if (txtMsg.startsWith(config.get('cmd_prefix'))) {
      const cmd = txtMsg.slice(config.get('cmd_prefix').length);
      if (
        config
          .get('superusers')
          .map((i) => i.toString())
          .includes(userId.toString()) ||
        isAllowedCmd(cmd)
      ) {
        const { success, output } = mc.runcmdEx(cmd);
        const stateTxt = success ? '成功' : '失败';
        fastReply(`执行${stateTxt}\n${output}`);
        logger.info(
          `执行指令 ${conGreen}${cmd} ${conYellow}${stateTxt}\n${conCyan}${output}`
        );
      } else {
        fastReply('权限不足');
      }
    } else if (txtMsg === config.get('cmd_status')) {
      sendGroupMsg(groupId, getServerStat());
    }
  }
}

/**
 * 群聊戳一戳处理
 * @param {object} ev
 */
function processGroupPoke(ev) {
  // 戳一戳获取服务器状态
  const {
    self_id: selfId,
    group_id: groupId,
    target_id: targetId,
    user_id: userId,
  } = ev;
  if (targetId === selfId) {
    logger.info(
      `${conMagenta}Group ${groupId}${conReset} -> ` +
        `${conYellow}${userId}${conCyan}戳了戳${conReset}我`
    );
    sendGroupMsg(groupId, getServerStat());
  }
}

/**
 * GoCQ事件处理
 */
function processEvent(ev) {
  const {
    echo,
    post_type: postType,
    message_type: messageType,
    notice_type: noticeType,
    meta_event_type: metaEventType,
    sub_type: subType,
    self_id: selfId,
    group_id: groupId,
  } = ev;
  // API调用返回处理
  if (echo !== undefined) {
    reqCache.set(echo, ev);
    return;
  }

  // 其他事件处理
  if (
    postType === 'meta_event' &&
    metaEventType === 'lifecycle' &&
    subType === 'connect'
  ) {
    // 连接成功
    logger.info(`Bot ${conCyan}${selfId} ${conGreen}已连接`);
  }

  const enableGroups = config.get('enable_groups').map((i) => i.toString());
  if (groupId !== undefined && enableGroups.includes(groupId.toString())) {
    if (
      (postType === 'message' || postType === 'message_sent') &&
      messageType === 'group' &&
      subType === 'normal'
    ) {
      // 群聊普通（回声）消息
      processGroupMsg(ev);
    } else if (
      postType === 'notice' &&
      noticeType === 'notify' &&
      subType === 'poke'
    ) {
      // 群聊戳一戳
      processGroupPoke(ev);
    }
  }
}

/**
 * 连接GoCQ
 * @returns {boolean} 是否成功
 */
function connectGoCQ() {
  ws.close();
  const success = ws.connect(config.get('ws_url'));
  if (success) {
    logger.info(`${conGreen}成功与GoCQ建立连接`);
  } else {
    logger.error('与GoCQ建立连接失败！');
  }
  return success;
}

/**
 * 重连GoCQ (async)
 */
function reconnectGoCQ() {
  const reconnect = () => {
    logger.info(`${conGreen}正在尝试与GoCQ建立连接……`);
    const ok = connectGoCQ();
    if (!ok) {
      logger.info(`${conYellow}3s后尝试再次重连……`);
      setTimeout(reconnect, 3000);
    } else {
      // eslint-disable-next-line no-use-before-define
      // startDetectConnection();
    }
    return ok;
  };
  reconnect();
}

/**
 * 停止检测ws连接状态进程
 */
/*
function stopDetectConnection() {
  clearInterval(detectTaskId);
  logger.info(`${conYellow}连接状态监控进程已停止`);
}
*/

/**
 * 启动检测ws连接状态进程
 */
/*
function startDetectConnection() {
  // 别问我为什么要调用接口校验连接
  // 因为 ws.state===ws.Open 的值即使连接上了也是false！！
  // 又是llse的锅……
  detectTaskId = setInterval(() => {
    getStatus((ret) => {
      if (ret === undefined) {
        logger.error(
          `调用接口失败！可能与GoCQ失去连接！${conReset}正在尝试重连……`
        );
        stopDetectConnection();
        reconnectGoCQ();
      }
    });
  }, 5000);
  logger.info(`${conGreen}连接状态监控进程已启动`);
}
*/

/**
 * 解析GoCQ下发数据
 */
ws.listen('onTextReceived', (text) => {
  logger.debug(`收到数据：${conCyan}${text}`);

  let ev;
  try {
    ev = JSON.parse(text);
  } catch (e) {
    logger.error(`解析GoCQ下发数据失败\n${e.stack}`);
    return;
  }
  processEvent(ev);
});

/**
 * ws发生错误
 */
ws.listen('onError', (msg) => {
  logger.error(`与GoCQ的连接出现错误！错误信息：${conCyan}${msg}`);
});

/**
 * 丢失与GoCQ连接处理
 */
ws.listen('onLostConnection', (code) => {
  // stopDetectConnection();
  logger.error(
    `与GoCQ失去连接！错误码：${conYellow}${code}${conReset}，正在尝试重连……`
  );
  reconnectGoCQ();
});

/**
 * 服务器启动成功时启动ws连接与监控进程
 */
mc.listen('onServerStarted', () => {
  reconnectGoCQ();
});

/**
 * 游戏内聊天转发到群
 */
mc.listen('onChat', (player, msg) => {
  (async () => {
    sendToAllEnableGroups(`[服务器] ${player.realName}：${msg}`);
  })().catch(throwError);
});

/**
 * 尝试进服提示
 */
mc.listen('onPreJoin', (player) => {
  if (!player.isSimulatedPlayer()) {
    (async () => {
      const { realName, xuid } = player;
      sendToAllEnableGroups(
        `[服务器] ${realName} 正在尝试进入服务器，XUID：${xuid}`
      );
    })().catch(throwError);
  }
});

/**
 * 进服提示
 */
mc.listen('onJoin', (player) => {
  if (!player.isSimulatedPlayer()) {
    (async () => {
      sendToAllEnableGroups(`[服务器] 欢迎 ${player.realName} 进入服务器`);
    })().catch(throwError);
  }
});

/**
 * 退服提示
 */
mc.listen('onLeft', (player) => {
  if (!player.isSimulatedPlayer()) {
    const { realName } = player;
    (async () => {
      sendToAllEnableGroups(`[服务器] ${realName} 退出了服务器`);
    })().catch(throwError);
  }
});

mc.regConsoleCmd('cqreconnect', '手动重连GoCQHTTP', () => {
  logger.info(`${conYellow}正在尝试重连……`);
  return reconnectGoCQ();
});

ll.registerPlugin('GoCQSync', '依赖GoCQHTTP的群服互通', [0, 4, 3], {
  Author: 'student_2333',
  License: 'Apache-2.0',
});
logger.info(`${conGreen}插件加载成功，欢迎使用～`);
