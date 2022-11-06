/* global ll mc JsonConfigFile Format PermType */
// LiteXLoader Dev Helper
/// <reference path="E:\Coding\bds\.vscode\LLSEDevHelper/Library/JS/Api.js" />

const pluginName = 'DeathQuery';

const deathLog = new JsonConfigFile(`plugins/${pluginName}/deathLog.json`);
const config = new JsonConfigFile(`plugins/${pluginName}/config.json`);
const maxRecords = config.init('maxRecords', 5);

const {
  Green,
  Red,
  Aqua,
  DarkGreen,
  LightPurple,
  MinecoinGold,
  Clear,
  Bold,
  White,
} = Format;

function getLogItem(pl, src) {
  function posItem(pos) {
    const { x, y, z, dim, dimid: dimId } = pos;
    return { x, y, z, dim, dimId };
  }

  function srcItem() {
    if (src) {
      const { name, type, health, maxHealth, pos } = src;
      return { name, type, health, maxHealth, pos: posItem(pos) };
    }
    return null;
  }

  return {
    pos: posItem(pl.pos),
    time: new Date().toJSON(),
    src: srcItem(),
  };
}

function logDeath(pl, src) {
  const { xuid } = pl;
  const item = getLogItem(pl, src);
  let log = deathLog.get(xuid, []);
  log = [item].concat(log.slice(0, maxRecords - 1));
  deathLog.set(xuid, log);
  return item;
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

function formatDeathFull(it) {
  const { pos, time, src } = it;
  const txt = [];

  txt.push(
    `- ${DarkGreen}死亡时间： ` +
      `${Bold}${MinecoinGold}${formatDate(new Date(time))}${Clear}`
  );
  txt.push(`- ${DarkGreen}死亡地点： ${Bold}${formatPos(pos)}${Clear}`);
  if (src) {
    const { name, type, health, maxHealth, pos: posSrc } = src;
    txt.push(`- ${DarkGreen}伤害来源信息：${Clear}`);
    txt.push(
      `  - ${DarkGreen}名称： ${Bold}${MinecoinGold}${name} ${Clear}${MinecoinGold}(${type})${Clear}`
    );
    txt.push(`  - ${DarkGreen}坐标： ${Bold}${formatPos(posSrc)}${Clear}`);
    txt.push(
      `  - ${DarkGreen}生命值： ${Bold}${MinecoinGold}${health}${Clear} / ${Bold}${Green}${maxHealth}`
    );
  }
  return txt.join('\n');
}

function formatDeathSimple(it) {
  const { pos, time, src } = it;
  let txt =
    `${DarkGreen}位置： ${Bold}${formatPos(pos)}${Clear}\n` +
    `${MinecoinGold}${formatDate(new Date(time))}${Clear}`;
  if (src) {
    txt += ` ${DarkGreen}死于${Bold}${Green}${src.name}`;
  }
  return txt;
}

function deathLogForm(pl) {
  function deathLogFullForm(log) {
    return (pl_, i) => {
      if (i !== null && i !== undefined) {
        pl_.sendForm(
          mc
            .newSimpleForm()
            .setTitle(`${Bold}${Green}详细记录`)
            .setContent(formatDeathFull(log[i]))
            .addButton(`${Green}返回上一级`),
          (p_, i_) => {
            if (i_ === 0) deathLogForm(p_);
          }
        );
      }
    };
  }

  const log = deathLog.get(pl.xuid, []);
  let form = mc.newSimpleForm().setTitle(`${Bold}${Green}死亡记录查询`);

  if (log.length > 0) {
    form.setContent(
      `${DarkGreen}已为你记录 ${Green}${log.length}${DarkGreen}/${Green}${maxRecords} ${DarkGreen}条死亡记录 `
    );
    log.forEach((i) => {
      form = form.addButton(formatDeathSimple(i));
    });
  } else {
    form.setContent(
      `${DarkGreen}目前还没有死亡记录（上限 ${Green}${maxRecords}${DarkGreen} 条）`
    );
  }
  pl.sendForm(form, deathLogFullForm(log));
}

function clearLog(pl) {
  pl.sendModalForm(
    '提示',
    `${Red}真的要清空死亡记录吗？`,
    `${DarkGreen}我想好了`,
    `${Red}我手滑了`,
    (pl_, res) => {
      if (res === true) {
        deathLog.set(pl.xuid, []);
        pl_.tell(`${Green}死亡记录已清空`);
      } else pl_.tell(`${Red}操作取消`);
    }
  );
}

function registerQueryCmd() {
  const cmd = mc.newCommand('deathlog', '查看最近死亡记录', PermType.Any);
  cmd.setAlias('dl');

  cmd.setCallback((_, origin, out) => {
    if (!origin.player) {
      out.error('该命令只能由玩家执行');
      return false;
    }
    deathLogForm(origin.player);
    return true;
  });

  cmd.overload();
  cmd.setup();
}

function registerClearCmd() {
  const cmd = mc.newCommand('cleardeathlog', '清除死亡记录', PermType.Any);
  cmd.setAlias('cdl');

  cmd.setCallback((_, origin, out) => {
    if (!origin.player) {
      out.error('该命令只能由玩家执行');
      return false;
    }
    clearLog(origin.player);
    return true;
  });

  cmd.overload();
  cmd.setup();
}

function registerCmd() {
  registerQueryCmd();
  registerClearCmd();
}

mc.listen('onPlayerDie', (pl, src_) => {
  const { pos } = logDeath(pl, src_);

  pl.tell(
    `${DarkGreen}您的上一次暴毙位置： ${Bold}${formatPos(pos)}${Clear}\n` +
      `${DarkGreen}使用 ${Bold}${MinecoinGold}/deathlog${Clear} 查看最近死亡记录`
  );
});
registerCmd();

ll.registerPlugin(pluginName, '自助查询死亡记录', [0, 1, 3], {
  Author: 'student_2333',
  License: 'Apache-2.0',
});
