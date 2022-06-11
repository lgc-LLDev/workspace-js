/* global JsonConfigFile WSClient mc ll colorLog Format */

// LiteLoaderScript Dev Helper
/// <reference path="c:\Users\Administrator\.vscode\extensions\moxicat.llscripthelper-1.0.1\lib/Library/JS/Api.js" />

const config = new JsonConfigFile('plugins/GoCQSync/config.json');
config.init('ws_url', 'ws://127.0.0.1:6700');
config.init('superusers', []);
config.init('enable_groups', []);

let ws = new WSClient(); // IDE type hint

const reqCache = new Map();

/**
 * 同步转promise
 * @param {Function} func
 * @param  {...any} args
 * @returns {Promise}
 */
function asyncCall(func, ...args) {
  return new Promise((resolve) => {
    resolve(func(...args));
  });
}

/**
 * 使用colorLog输出error
 * @param {Error} e
 * @param {string} reason
 */
function colorLogErr(e, reason = '') {
  colorLog('red', `${reason}\n${e.stack}`);
}

/**
 * 根据condition的值返回相应的指定值
 * @param {boolean} condition
 * @param {any} ifTrue condition===true时返回值
 * @param {any} ifFalse condition===false时返回值
 */
function choice(condition, ifTrue, ifFalse) {
  if (condition) return ifTrue;
  return ifFalse;
}

/**
 * 向GoCQ发送数据
 * @param {object} data
 */
function sendData(data) {
  if (!ws.send(JSON.stringify(data))) {
    colorLog('red', '向GoCQ发送数据失败！');
    throw new Error('发送数据失败');
  }
}

/**
 * 调用GoCQ API
 * @param {string} name
 * @param {object} data
 * @param {Function} callback
 */
function callAPI(name, data, callback = () => {}) {
  const echo = new Date().getTime().toString();
  // colorLog('green', `调用API"${name}"，echo=${echo}，等待返回数据`);
  try {
    sendData({ action: name, params: data, echo });
  } catch {
    callback(undefined);
  }
  const checkFunc = () => {
    const ret = reqCache.get(echo);
    if (ret !== undefined) {
      // colorLog('green', `API=${name}，echo=${echo}，已返回数据：${ret}`);
      reqCache.delete(echo);
      callback(ret);
    } else {
      setTimeout(checkFunc, 0);
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
function getStatus(callback = () => {}) {
  return callAPI('get_status', {}, callback);
}

/**
 * 向所有启用群发消息
 * @param {string|Array<object>} msg
 * @param {boolean} autoEscape 是否自动转CQ码
 */
function sendToAllEnableGroups(msg, autoEscape = false) {
  config.get('enable_groups').forEach((g) => {
    sendGroupMsg(g, msg, autoEscape);
  });
}

/**
 * 消息object转文本
 * @param {Array<object>} msg
 */
function messageObjectToString(msg) {
  /**
   * 给文字两头加上文本（处理特殊消息格式化）
   * @param {string} t text
   * @param {string} start
   * @param {string} end
   */
  function addHeadAndTail(
    t,
    start = `${Format.Aqua}[`,
    end = `]${Format.Clear}`
  ) {
    return `${start}${t}${end}`;
  }

  return msg
    .map((i) => {
      switch (i.type) {
        case 'text':
          return i.data.text;
        case 'face':
          return addHeadAndTail('表情');
        case 'record': {
          return addHeadAndTail(
            `${choice(i.data.magic === '1', '变声', '')}语音`
          );
        }
        case 'video':
          return addHeadAndTail('视频');
        case 'at':
          return addHeadAndTail(`@${i.data.qq}`);
        case 'rps':
          return addHeadAndTail('猜拳');
        case 'dice':
          return addHeadAndTail('骰子');
        case 'share': {
          const { title, url } = i.data;
          return addHeadAndTail(`分享：${title}（${url}）`);
        }
        case 'contact': {
          const { type, id } = i.data;
          return addHeadAndTail(
            `推荐${choice(type === 'qq', '联系人', '群聊')}：${id}`
          );
        }
        case 'location': {
          const {
            lat, // 纬度
            lon, // 经度
          } = i.data;
          return addHeadAndTail(`位置：${lon}, ${lat}`);
        }
        case 'image': {
          return addHeadAndTail(
            choice(i.data.subType === '1', '动画表情', '图片')
          );
        }
        case 'reply':
          return addHeadAndTail('回复');
        case 'redbag':
          return addHeadAndTail(`红包：${i.data.title}`);
        case 'forward':
          return addHeadAndTail('合并转发');
        case 'xml':
        // fallthrough
        case 'json':
          return addHeadAndTail('卡片消息');
        default:
          return addHeadAndTail('特殊消息');
      }
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
    return `${p.name} | ${dv.os} | ${dv.avgPing}ms(${dv.avgPacketLoss}% loss)`;
  })
  .join('\n')}
`.trim();
}

/**
 * 群消息处理
 * @param {object} ev
 */
function processGroupMsg(ev) {
  const {
    self_id: selfId,
    user_id: userId,
    message,
    raw_message: rawMessage,
    group_id: groupId,
    sender: { nickname, card },
  } = ev;

  /**
   * 往来源群聊发送消息
   * @param {string|Array<object>} msg
   * @param {boolean} autoEscape 是否自动转CQ码
   */
  function fastReply(msg, autoEscape = false) {
    sendGroupMsg(groupId, msg, autoEscape);
  }

  if (rawMessage.startsWith('/')) {
    if (
      config.get('superusers').includes(userId.toString()) &&
      userId !== selfId // 回声消息不会触发指令执行
    ) {
      const { success, output } = mc.runcmdEx(rawMessage.slice(1));
      fastReply(`执行${choice(success, '成功', '失败')}\n${output}`);
    } else {
      fastReply('权限不足');
    }
  }

  // 群聊信息转服务器
  const { Gold, Green, Gray, LightPurple, Bold, Clear } = Format;
  mc.broadcast(
    `${LightPurple}${Bold}[群聊]${Clear}${Green} ${choice(
      card === '',
      nickname,
      card
    )}${Gold}（${userId}）${Gray}： ${Clear}${messageObjectToString(message)}`
  );
}

/**
 * 群聊戳一戳处理
 * @param {object} ev
 */
function processGroupPoke(ev) {
  // 戳一戳获取服务器状态
  const { self_id: selfId, group_id: groupId, target_id: targetId } = ev;
  if (targetId === selfId) {
    sendGroupMsg(groupId, getServerStat());
  }
}

/**
 * GoCQ事件处理
 */
function wsOnText(msg) {
  // log(msg);
  let ev;
  try {
    ev = JSON.parse(msg);
  } catch (e) {
    colorLogErr(e, '解析GoCQ下发数据失败');
  }

  const {
    echo,
    post_type: postType,
    message_type: messageType,
    notice_type: noticeType,
    sub_type: subType,
    group_id: groupId,
  } = ev;
  // API调用返回处理
  if (echo !== undefined) {
    reqCache.set(echo, ev);
    return;
  }

  // 其他事件处理
  const enableGroups = config.get('enable_groups');
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
 * ws发生错误
 */
function wsOnError(msg) {
  colorLog('red', `与GoCQ的连接出现错误！错误信息：${msg}`);
}

/**
 * 连接GoCQ
 */
function connectGoCQ() {
  ws.close();
  ws = new WSClient(); // 防继续使用closed client
  ws.listen('onTextReceived', wsOnText);
  ws.listen('onError', wsOnError);
  if (ws.connect(config.get('ws_url'))) {
    colorLog('green', '成功与GoCQ建立连接');
  } else {
    colorLog('red', '与GoCQ建立连接失败！');
  }
}

/**
 * 检测ws连接状态
 */
function detectConnection() {
  getStatus((ret) => {
    if (ret === undefined) {
      colorLog('red', '与GoCQ失去连接！正在尝试重连……');
      connectGoCQ();
    }
  });
}

/**
 * 服务器启动成功时启动ws连接与监控进程
 */
mc.listen('onServerStarted', () => {
  colorLog('green', '正在与GoCQ建立连接……');
  asyncCall(connectGoCQ);
  setInterval(detectConnection, 5000);
});

/**
 * 游戏内聊天转发到群
 */
mc.listen('onChat', (player, msg) => {
  asyncCall(() => {
    sendToAllEnableGroups(`[服务器] ${player.name}：${msg}`);
  });
});

/**
 * 尝试进服提示
 */
mc.listen('onPreJoin', (player) => {
  asyncCall(() => {
    const { name, xuid } = player;
    sendToAllEnableGroups(`[服务器] ${name} 正在尝试进入服务器，XUID：${xuid}`);
  });
});

/**
 * 进服提示
 */
mc.listen('onJoin', (player) => {
  asyncCall(() => {
    sendToAllEnableGroups(`[服务器] 欢迎 ${player.name} 进入服务器`);
  });
});

/**
 * 退服提示
 */
mc.listen('onLeft', (player) => {
  const { name } = player;
  asyncCall(() => {
    sendToAllEnableGroups(`[服务器] ${name} 退出了服务器`);
  });
});

mc.regConsoleCmd('cqreconnect', '手动重连GoCQHTTP', () => {
  colorLog('yellow', '正在与GoCQ断开连接……');
  ws.close();
});

ll.registerPlugin('GoCQSync', '依赖GoCQHTTP的群服互通', [0, 1, 3], {
  author: 'student_2333',
  license: 'Apache-2.0',
});
