/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/triple-slash-reference */
/* global ll mc Format PermType ParamType BinaryStream Packet Command CommandOrigin CommandOutput */
// LiteLoaderScript Dev Helper
/// <reference path="d:\Coding\LLSEAids/dts/llaids/src/index.d.ts"/>

import * as fs from 'fs';
import { fromArrayBuffer, Song } from '@encode42/nbs.js';

const pluginName = 'NbsPlayer';
const pluginDataPath = `plugins/${pluginName}/`;
// const pluginCachePath = `${pluginDataPath}cache/`;

if (!fs.existsSync(pluginDataPath)) fs.mkdirSync(pluginDataPath);
// if (!fs.existsSync(pluginCachePath)) fs.mkdirSync(pluginCachePath);

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
const builtInInstruments = new Map([
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
const bossBarId = 627752937; // NbsPlayer九键(xd

const playTasks: Map<string, NodeJS.Timer | boolean> = new Map();

function readNbs(
  name: string,
  callback: (ok: boolean, resultOrError: string | Song | undefined) => unknown
) {
  const nbsPath = `${pluginDataPath}${name}`;
  fs.readFile(nbsPath, (err, data) => {
    if (err) callback(false, err.stack);
    else callback(true, fromArrayBuffer(data.buffer));
  });
}

function stopPlay(xuid: string, setNew?: boolean): boolean {
  const taskId = playTasks.get(xuid);
  if (taskId) {
    if (typeof taskId === 'object') clearInterval(taskId);

    if (setNew) playTasks.set(xuid, true);
    else playTasks.delete(xuid);

    const pl = mc.getPlayer(xuid);
    if (pl) pl.removeBossBar(bossBarId);

    return true;
  }
  return false;
}

function getPlaySoundDataPack(
  bs: BinaryStream,
  sound: string,
  position: FloatPos,
  volume: number,
  pitch: number
): Packet {
  bs.reset();
  bs.writeString(sound);

  bs.writeVarInt(Math.round(position.x * 8));
  bs.writeUnsignedVarInt(Math.round(position.y * 8));
  bs.writeVarInt(Math.round(position.z * 8));

  bs.writeFloat(volume);
  bs.writeFloat(pitch);

  return bs.createPacket(86);
}

function startPlay(player: Player, nbsName: string) {
  const { xuid } = player;
  const playingTask = playTasks.get(xuid);
  if (playingTask) stopPlay(xuid, true);

  player.setBossBar(bossBarId, `${Green}解析nbs文件……`, 100, 4);

  readNbs(nbsName, (ok, ret) => {
    if (!ok) {
      player.tell(`${Red}文件读取出错！\n${ret}`, 0);
      player.removeBossBar(bossBarId);
      return;
    }

    if (!(ret instanceof Song)) return;
    const {
      errors,
      meta: { name, author, originalAuthor },
      length,
      instruments: { loaded: loadedIns },
      layers,
      timePerTick,
    } = ret;

    if (errors.length > 0) {
      player.tell(`${Red}文件解析出错！\n${errors.join('\n')}`, 0);
      player.removeBossBar(bossBarId);
      return;
    }

    let songDisplayName = Aqua as string;
    if (name) {
      songDisplayName += name;
      const displayAuthor = originalAuthor || author;
      if (displayAuthor)
        songDisplayName += `${White} - ${Green}${displayAuthor}`;
    } else songDisplayName += nbsName;
    const bossBarTxt = `${Green}▶ ${LightPurple}NbsPlayer${Gray} | ${songDisplayName}`;

    // note数据[name, vol, pitch]
    type ParsedNote = [string | undefined, number, number];
    type ParsedLayer = Array<ParsedNote>;
    const parsedNotes: Array<ParsedLayer> = [];
    for (const layer of layers) {
      parsedNotes.push(
        // eslint-disable-next-line no-loop-func
        layer.notes.map((n) => {
          const { instrument, velocity, key, pitch } = n;
          const { volume } = layer;
          const {
            key: insKey,
            builtIn,
            meta: { soundFile },
          } = loadedIns[instrument];

          const finalKey = key + (insKey - 45) + pitch / 100;
          const insName = builtIn
            ? builtInInstruments.get(instrument)
            : soundFile.replace(/\.(ogg|mp3|wav)/g, '');

          return [
            insName,
            (velocity * volume) / 100,
            2 ** ((finalKey - 45) / 12),
          ];
        })
      );
    }

    const totalLength = timePerTick * length;

    let passedTick = 0;
    let lastBossBarIndex = -1; // boss bar初始为0，设为-1以便初始更新boss bar
    const startTime = Date.now();

    const bs = new BinaryStream();

    const task = () => {
      const timeSpent = Date.now() - startTime;
      const nowTick = Math.floor(timeSpent / timePerTick);
      if (nowTick <= passedTick) return;

      const passedInterval = nowTick - passedTick;
      passedTick = nowTick;

      const pl = mc.getPlayer(xuid);
      if (!(parsedNotes[0].length && pl)) {
        stopPlay(xuid);
        return;
      }

      const { pos } = pl;
      pos.y += 0.37;
      parsedNotes.forEach((layer: ParsedLayer) => {
        for (let i = 0; i < passedInterval; i += 1) {
          const n = layer.shift();
          if (n) {
            const [insName, vol, pitch] = n;
            if (insName)
              pl.sendPacket(getPlaySoundDataPack(bs, insName, pos, vol, pitch));
          }
        }
      });

      const bossBarIndex = Math.floor((timeSpent / totalLength) * 100);
      if (bossBarIndex !== lastBossBarIndex) {
        lastBossBarIndex = bossBarIndex;
        pl.setBossBar(bossBarId, bossBarTxt, bossBarIndex, 3);
      }
    };

    playTasks.set(xuid, setInterval(task, 0));
  });
}

/**
 * @param {Player} player
 */
function nbsForm(player: Player) {
  const pageMax = 15;
  const musics: Array<string> = [];
  fs.readdirSync(pluginDataPath).forEach((v) => {
    if (v.toLowerCase().endsWith('.nbs')) musics.push(v);
  });

  if (musics.length === 0) {
    player.sendModalForm(
      `${Aqua}${pluginName}`,
      `${Green}插件数据目录内还没有歌曲文件哦！赶快去寻找nbs音乐来播放吧！`,
      `知道了`,
      `知道了`,
      () => {}
    );
    return;
  }

  const search = (param: string) => {
    const paramL = param.toLowerCase().replace(' ', '');
    const result: Array<string> = [];
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

  const sendForm = (page: number) => {
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
              const [param] = data;
              if (param) {
                search(param);
              } else player.tell(`${Red}请输入搜索内容`);
            } else sendForm(page);
          });
          return;
        }

        if (i === 1) {
          if (maxPage < 2) {
            player.sendModalForm(
              `${Aqua}${pluginName}`,
              `${Red}页面总数小于2，无法跳转`,
              `知道了`,
              `知道了`,
              () => sendForm(page)
            );
            return;
          }

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

/**
 * 去两侧引号
 */
function trimQuote(str: string) {
  if (str && str.startsWith('"') && str.endsWith('"'))
    return str.slice(1, str.length - 1);
  return str;
}

(() => {
  const cmd = mc.newCommand('nbsplayer', '来首音乐嘛？', PermType.Any);
  cmd.setAlias('nbs');
  cmd.optional('filename', ParamType.RawText);
  cmd.overload(['filename']);

  cmd.setCallback(
    (
      _: Command,
      origin: CommandOrigin,
      out: CommandOutput,
      result: { filename?: string }
    ) => {
      const { player } = origin;
      if (!player) {
        out.error('该命令只能由玩家执行');
        return false;
      }

      const { filename } = result;
      if (filename) {
        const filePath = `${pluginDataPath}${trimQuote(filename)}`;
        if (!fs.existsSync(filePath)) {
          out.error('文件不存在！');
          return false;
        }

        startPlay(player, trimQuote(filename));
        return true;
      }

      nbsForm(player);
      return true;
    }
  );

  cmd.setup();
})();

(() => {
  const cmd = mc.newCommand('nbsplay', '管理员播放指令');
  cmd.mandatory('player', ParamType.Player);
  cmd.mandatory('filename', ParamType.String);
  cmd.optional('forcePlay', ParamType.Bool);
  cmd.overload(['player', 'filename', 'forcePlay']);

  cmd.setCallback(
    (
      _: Command,
      __: CommandOrigin,
      out: CommandOutput,
      result: { player: Array<Player>; filename: string; forcePlay?: boolean }
    ) => {
      const { player, filename, forcePlay } = result;
      const trimmedFilename = trimQuote(filename);
      const filePath = `${pluginDataPath}${trimmedFilename}`;
      if (player.length === 0) {
        out.error('玩家不在线');
        return false;
      }

      if (!fs.existsSync(filePath)) {
        out.error('文件不存在！');
        return false;
      }

      player.forEach((p: Player) => {
        if (forcePlay || !playTasks.get(p.xuid)) {
          startPlay(p, trimmedFilename);
          out.success(`成功为 ${p.name} 播放 ${filename}`);
          return;
        }
        out.error(`玩家 ${p.name} 正在播放中，操作失败`);
      });
      return true;
    }
  );

  cmd.setup();
})();

(() => {
  const cmd = mc.newCommand('nbstop', '停止播放nbs', PermType.Any);
  cmd.overload();

  cmd.setCallback((_: Command, origin: CommandOrigin, out: CommandOutput) => {
    const { player } = origin;
    if (!player) {
      out.error('该命令只能由玩家执行');
      return false;
    }

    if (stopPlay(player.xuid)) return out.success('操作成功');

    out.error('操作失败');
    return false;
  });

  cmd.setup();
})();

(() => {
  const cmd = mc.newCommand('nbsisplaying', '玩家是否正在播放', PermType.Any);
  cmd.overload();

  cmd.setCallback((_: Command, origin: CommandOrigin, out: CommandOutput) => {
    const { player } = origin;
    if (!player) {
      out.error('该命令只能由玩家执行');
      return false;
    }

    if (playTasks.get(player.xuid)) return out.success('true');

    out.error('false');
    return false;
  });

  cmd.setup();
})();

mc.listen('onLeft', (pl: Player) => stopPlay(pl.xuid));

ll.registerPlugin(pluginName, '在服务器播放NBS音乐！', [1, 0, 1], {
  Author: 'student_2333',
  License: 'Apache-2.0',
});
