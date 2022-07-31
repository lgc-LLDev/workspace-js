/* global ll mc system Format PermType logger */
// LiteLoaderScript Dev Helper
/// <reference path="E:\Coding\bds\.vscode\LLSEDevHelper/Library/JS/Api.js" />

const pluginName = 'NbsPlayer';
const pluginDataPath = `plugins/${pluginName}/`;
const nbsConvertorPath = `${pluginDataPath}bin/NbsConvertor.exe`;
const pluginCachePath = `${pluginDataPath}cache/`;

if (!File.exists(pluginDataPath)) File.mkdir(pluginDataPath);
if (!File.exists(pluginCachePath)) File.mkdir(pluginCachePath);

const {
  Red,
  White,
  Aqua,
  Yellow,
  Green,
  Gray,
  Gold,
  DarkAqua,
  LightPurple,
  DarkGreen,
  DarkBlue,
} = Format;
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
const instrumentMaxID = instrumentMap.size - 1;
const keyMap = new Map();

for (let i = 0; i < 46; i += 1) {
  keyMap.set(45 + i, 2 ** (i / 12));
  keyMap.set(45 - i, 2 ** (-i / 12));
}

const playTasks = new Map();

/**
 * @param {String} name
 * @param {(ok:Boolean,resultOrError:String|Object|undefined)} callback
 * @returns
 */
function convertNbs(name, callback) {
  const nbsPath = `${pluginDataPath}${name}`;
  const nbsCachePath = `${pluginCachePath}${name}.json`;
  return system.newProcess(
    `${nbsConvertorPath} -f "${nbsPath}" -o "${nbsCachePath}"`,
    (code, returns) => {
      if (!code === 0) {
        logger.error(`转换nbs文件出错\n${returns}`);
        callback(false, '转换nbs文件出错');
        return;
      }

      Promise.resolve()
        .then(() => File.readFrom(nbsCachePath))
        .then((t) => {
          if (!t) {
            callback(false, '读取文件失败');
            return;
          }

          let j;
          try {
            j = JSON.parse(t);
          } catch {
            callback(false, '解析转换后Json失败');
            return;
          }

          File.delete(nbsCachePath);
          callback(true, j);
        });
    }
  );
}

/**
 * @param {Player} player
 * @returns {Boolean}
 */
function stopPlay(xuid) {
  const taskId = playTasks.get(xuid);
  if (taskId) {
    clearInterval(taskId);
    const ret = playTasks.delete(xuid);

    const pl = mc.getPlayer(xuid);
    if (pl) pl.tell(`${Red}■ ${LightPurple}NbsPlayer\n\n`, 4);

    return ret;
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

  player.tell(`${Green}解析nbs文件……`, 4);

  convertNbs(nbsName, (ok, ret) => {
    if (!ok) {
      player.tell(`${Red}文件转换出错！\n错误原因： ${ret}`);
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
      instruments,
      layers,
    } = ret;

    const instrumentPitchMap = new Map();
    const instrumentMapEx = new Map();
    instrumentMap.forEach((v, k) => instrumentMapEx.set(k, v));
    instruments.forEach((v) => {
      const { id, name: insName, pitch } = v;
      const insId = instrumentMaxID + 1 + id;
      instrumentMapEx.set(insId, insName);
      instrumentPitchMap.set(insId, pitch - 45);
    });

    const layerVolMap = new Map();
    layers.forEach((v) => {
      const { id, volume } = v;
      layerVolMap.set(id, volume);
    });

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
    const totalNotes = noteAndTime.length;
    const startTime = Date.now();

    const task = () => {
      let notesRemain = noteAndTime.length;
      const pl = mc.getPlayer(xuid);
      if (notesRemain === 0 || !pl) {
        stopPlay(xuid);
        return;
      }

      const timeSpent = Date.now() - startTime;
      const willPlay = [];

      for (;;) {
        notesRemain = noteAndTime.length;
        if (notesRemain === 0) break;

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
        const { instrument, velocity, key, pitch, layer } = note;

        const insPitch = instrumentPitchMap.get(instrument) || 0;
        const finalPitch = key + pitch + insPitch;

        const layerVol = layerVolMap.get(layer) || 100;
        const finalVol = (velocity * (layerVol / 100)) / 100;

        const cmd =
          `execute "${realName}" ~~~ ` +
          `playsound ${instrumentMapEx.get(instrument)} @s ~ ~1.65 ~ ` +
          `${finalVol} ${keyMap.get(finalPitch)}`;
        // log(cmd);
        mc.runcmdEx(cmd);
      });

      const timeSpentStr = formatMsTime(timeSpent);
      pl.tell(
        `${Green}▶ ${LightPurple}NbsPlayer\n` +
          `${songDisplayName}\n` +
          `${Yellow}${timeSpentStr} ${White}/ ${Gold}${totalLengthStr}` +
          `${Gray} | ` +
          `${Yellow}${totalNotes - notesRemain} ${White}/ ${Gold}${totalNotes}`,
        4
      );
    };

    playTasks.set(xuid, setInterval(task, 0));
  });
}

/**
 * @param {Player} player
 */
function nbsForm(player) {
  const pageMax = 15;
  const musics = [];
  File.getFilesList(pluginDataPath).forEach((v) => {
    if (v.toLowerCase().endsWith('.nbs')) musics.push(v);
  });

  const search = (param) => {
    const paramL = param.toLowerCase().replace(' ', '');
    const result = [];
    musics.forEach((v) => {
      if (v.toLowerCase().replace(' ', '').includes(paramL)) result.push(v);
    });

    let form = mc.newSimpleForm();
    form = form
      .setTitle(`${Aqua}${pluginName}`)
      .setContent(
        `${Green}搜寻到 ${Yellow}${result.length} ${Green}条` +
          `关于 ${Aqua}${param} ${Green}的结果`
      );
    result.forEach((v) => {
      form = form.addButton(`${DarkAqua}${v}`);
    });
    player.sendForm(form, (_, i) => {
      if (i !== null && i !== undefined) {
        startPlay(player, result[i]);
      }
    });
  };

  const sendForm = (page) => {
    const maxPage = Math.ceil(musics.length / pageMax);
    const index = pageMax * (page - 1);
    const pageContent = musics.slice(index, index + pageMax);

    let pageUp = false;
    let pageDown = false;
    let form = mc.newSimpleForm();
    form
      .setTitle(`${Aqua}${pluginName}`)
      .setContent(
        `${Green}页数 ${Yellow}${page} ${White}/ ${Gold}${maxPage} ${Gray}| ` +
          `${Green}总数 ${Yellow}${musics.length}`
      )
      .addButton(`${DarkBlue}搜索`)
      .addButton(`${DarkBlue}跳页`);
    if (page > 1) {
      form = form.addButton(`${DarkGreen}<- 上一页`);
      pageUp = true;
    }
    pageContent.forEach((v) => {
      form = form.addButton(`${DarkAqua}${v}`);
    });
    if (page < maxPage) {
      form = form.addButton(`${DarkGreen}下一页 ->`);
      pageDown = true;
    }

    player.sendForm(form, (_, i) => {
      if (i !== null && i !== undefined) {
        if (i === 0) {
          const searchForm = mc
            .newCustomForm()
            .setTitle(`${Aqua}${pluginName}`)
            .addInput('请输入搜索内容');
          player.sendForm(searchForm, (__, data) => {
            if (data) {
              let [param] = data;
              param = param.trim();
              if (param) {
                search(param);
              } else player.tell(`${Red}请输入搜索内容`);
            } else sendForm(page);
          });
          return;
        }

        if (i === 1) {
          const toPageForm = mc
            .newCustomForm()
            .setTitle(`${Aqua}${pluginName}`)
            .addSlider('请选择跳转到的页数', 1, maxPage, 1, page);
          player.sendForm(toPageForm, (__, data) => {
            if (data) sendForm(data[0]);
            else sendForm(page);
          });
          return;
        }

        let fIndex = i - 2;
        if (pageUp) {
          if (fIndex === 0) {
            sendForm(page - 1);
            return;
          }

          fIndex -= 1;
        }

        if (pageDown) {
          if (fIndex === pageMax) {
            sendForm(page + 1);
            return;
          }
        }

        startPlay(player, pageContent[fIndex]);
      }
    });
  };

  sendForm(1);
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
    nbsForm(player);
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

ll.registerPlugin(pluginName, '在服务器播放NBS音乐！', [0, 1, 1], {
  Author: 'student_2333',
  License: 'Apache-2.0',
});
