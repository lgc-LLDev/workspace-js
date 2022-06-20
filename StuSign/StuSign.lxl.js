/* global mc logger ll JsonConfigFile money Format */
// LiteLoaderScript Dev Helper
/// <reference path="d:\Coding\bds\.vscode\LLSEDevHelper/Library/JS/Api.js" />

const config = new JsonConfigFile('plugins/StuSign/config.json');
const minMoney = config.init('minMoney', 500);
const maxMoney = config.init('maxMoney', 2000);
const moneyName = config.init('moneyName', '金币');

const logConf = new JsonConfigFile('plugins/StuSign/log.json');

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
 * 签到
 * @param {Player} player
 */
function sign(player) {
  const nowDate = new Date().toLocaleDateString();
  const lastSignDate = logConf.get(player.xuid);
  logger.info(
    `玩家 ${player.realName} 上次签到 ${lastSignDate}，当前 ${nowDate}`
  );

  if (lastSignDate !== nowDate) {
    const addMoney = getRandomInt(minMoney, maxMoney);
    logger.info(
      `玩家 ${player.realName} 执行签到，给予 ${addMoney} ${moneyName}`
    );

    money.add(player.xuid, addMoney);
    logConf.set(player.xuid, nowDate);

    const { Green, MinecoinGold, Clear, Bold, Yellow, Aqua } = Format;
    const msg = [
      `${Green}欢迎回来， ${Bold}${MinecoinGold}${player.realName}${Clear}${Green}~`,
      `今日进入游戏签到获取了 ${Bold}${Yellow}${addMoney} ${Clear}${Aqua}${moneyName}${Green}~`,
    ];

    player.sendText(msg.join('\n'));
    mc.runcmd(`title "${player.name}" subtitle ${msg[1]}`);
    mc.runcmd(`title "${player.name}" title ${msg[0]}`);
    mc.runcmd(`playsound random.levelup "${player.name}"`);
  }
}

mc.listen('onJoin', sign);

setInterval(() => {
  const date = new Date();
  if (
    date.getHours() === 0 &&
    date.getMinutes() === 0 &&
    date.getSeconds() === 0
  ) {
    mc.getOnlinePlayers().forEach((pl) => sign(pl));
  }
}, 1000);

ll.registerPlugin('StuSign', '简洁的入服签到插件', [0, 1, 1], {
  Author: 'student_2333',
  License: 'Apache-2.0',
});
logger.info('插件加载成功~');
