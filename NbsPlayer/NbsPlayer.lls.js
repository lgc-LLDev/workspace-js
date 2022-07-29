/* global ll mc system Format PermType */
// LiteLoaderScript Dev Helper
/// <reference path="E:\Coding\bds\.vscode\LLSEDevHelper/Library/JS/Api.js" />

const pluginName = 'NbsPlayer';
const pluginDataPath = `plugins/${pluginName}/`;
const nbsConvertorPath = `${pluginDataPath}bin/NbsConvertor.exe`;
const pluginCachePath = `${pluginDataPath}cache/`;

if (!File.exists(pluginDataPath)) File.mkdir(pluginDataPath);
if (!File.exists(pluginCachePath)) File.mkdir(pluginCachePath);

const { Red, White, Aqua, Yellow, Green, Gray, Gold } = Format;
const instrumentMap = new Map([
  [0, 'note.harp'],
  [1, 'note.bassattack'],
  [2, 'note.bd'],
  [3, 'note.snare'],
  [4, 'note.hat'],
  [5, 'note.guitar'],
  [6, 'note.flute'],
  [7, 'note.bell'],
  [8, 'note.chime'],
  [9, 'note.xylobone'],
  [10, 'note.iron_xylophone'],
  [11, 'note.cow_bell'],
  [12, 'note.didgeridoo'],
  [13, 'note.bit'],
  [14, 'note.banjo'],
  [15, 'note.pling'],
]);
const keyMap = new Map();

for (let i = 0; i < 46; i += 1) {
  keyMap.set(45 + i, 2 ** (i / 12));
  keyMap.set(45 - i, 2 ** (-i / 12));
}

const playTasks = new Map();

/**
 * @param {String} name
 * @param {(ok:Boolean,result:Object|undefined)} callback
 * @returns
 */
function convertNbs(name, callback) {
  const nbsPath = `${pluginDataPath}${name}`;
  const nbsCachePath = `${pluginCachePath}${name}.json`;
  return system.newProcess(
    `${nbsConvertorPath} -f "${nbsPath}" -o "${nbsCachePath}"`,
    (code) => {
      if (!code === 0) {
        callback(false);
        return;
      }

      const ok = new File(nbsCachePath, File.ReadMode).readAll((ret) => {
        let j;
        try {
          j = JSON.parse(ret);
        } catch {
          callback(false);
          return;
        }

        callback(true, j);
      });

      if (!ok) callback(false);
    }
  );
}

function stopPlay(xuid) {
  const taskId = playTasks.get(xuid);
  if (taskId) {
    clearInterval(taskId);
    return playTasks.delete(xuid);
  }
  return false;
}

function tickToMs(tick, tempo) {
  const realTick = tick * (20 / tempo); // 真实Tick数
  const second = realTick / 20; // 转秒
  return second * 1000;
}

function formatMsTime(msTime) {
  const ms = (msTime % 1000).toString()[0];
  const sec = Math.floor((msTime / 1000) % 60)
    .toString()
    .padStart(2, '0');
  const min = Math.floor(msTime / 1000 / 60).toString();
  return `${min}:${sec}.${ms}`;
}

/**
 * @param {Player} player
 * @param {String} nbsName
 */
function startPlay(player, nbsName) {
  const { xuid, realName } = player;
  const playingTask = playTasks.get(xuid);
  if (playingTask) stopPlay(xuid);

  player.tell(`${Green}解析nbs文件……`, 5);

  convertNbs(nbsName, (ok, ret) => {
    if (!ok) {
      player.tell(
        `${Red}文件转换出错！\n` +
          `错误原因可能为： 找不到文件 / nbs文件转换失败 / 转换后文件解析失败`
      );
      return;
    }

    const {
      header: {
        song_length: length,
        song_name: name,
        song_author: author,
        original_author: originAuthor,
        tempo,
      },
      notes,
    } = ret;

    let songDisplayName = Aqua;
    if (name) {
      songDisplayName += name;
      const displayAuthor = originAuthor || author;
      if (displayAuthor)
        songDisplayName += `${White} - ${Green}${displayAuthor}`;
    } else songDisplayName += nbsName;

    const totalLength = tickToMs(length, tempo);
    const totalLengthStr = formatMsTime(totalLength);

    const noteAndTime = notes.map((v) => ({
      time: tickToMs(v.tick, tempo),
      note: v,
    }));
    const startTime = Date.now();

    const task = () => {
      const willPlay = [];
      const pl = mc.getPlayer(xuid);
      const timeSpent = Date.now() - startTime;

      for (;;) {
        if (noteAndTime.length === 0 || !pl) {
          stopPlay(xuid);
          pl.tell('', 5);
          return;
        }
        const { time, note } = noteAndTime[0];
        if (time <= timeSpent) {
          willPlay.push(note);
          noteAndTime.shift();
        } else break;
      }

      // const {
      //   pos: { x, y, z },
      // } = pl;
      willPlay.forEach((note) => {
        // log(note);
        const { instrument, velocity, key } = note;
        const cmd =
          `execute "${realName}" ~~~ ` +
          `playsound ${instrumentMap.get(instrument)} @s ~~~ ` +
          `${velocity / 100} ${keyMap.get(key)}`;
        // log(cmd);
        mc.runcmdEx(cmd);
      });
      pl.tell(
        `${songDisplayName} ${Gray}| ` +
          `${Yellow}${formatMsTime(timeSpent)} ${White}- ` +
          `${Gold}${totalLengthStr}`,
        5
      );
    };

    playTasks.set(xuid, setInterval(task, 0));
  });
}

(() => {
  const cmd = mc.newCommand('nbsplayer', '来首音乐嘛？', PermType.Any);
  cmd.setAlias('nbs');

  cmd.setCallback((_, origin, out) => {
    const { player } = origin;
    if (!player) {
      out.error('该命令只能由玩家执行');
      return false;
    }
    startPlay(player, 'Fix You.nbs');
    return true;
  });

  cmd.overload();
  cmd.setup();
})();

(() => {
  const cmd = mc.newCommand('nbstop', '停止播放nbs', PermType.Any);

  cmd.setCallback((_, origin, out) => {
    const { player } = origin;
    if (!player) {
      out.error('该命令只能由玩家执行');
      return false;
    }

    if (stopPlay(player.xuid)) return out.success('操作成功');

    out.error('操作失败');
    return false;
  });

  cmd.overload();
  cmd.setup();
})();

mc.listen('onLeft', (pl) => stopPlay(pl.xuid));

ll.registerPlugin(pluginName, '在服务器播放NBS音乐！', [0, 1, 0], {
  Author: 'student_2333',
  License: 'Apache-2.0',
});
