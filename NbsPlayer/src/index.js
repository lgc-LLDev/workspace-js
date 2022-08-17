"use strict";
/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable @typescript-eslint/triple-slash-reference */
/* global ll mc Format PermType ParamType BinaryStream Packet Command CommandOrigin CommandOutput */
// LiteLoaderScript Dev Helper
/// <reference path="C:\Users\Administrator\.vscode\extensions\moxicat.llscripthelper-1.0.1\lib\Library/JS/Api.js" />
exports.__esModule = true;
var fs = require("fs");
var nbs_js_1 = require("@encode42/nbs.js");
var pluginName = 'NbsPlayer';
var pluginDataPath = "plugins/".concat(pluginName, "/");
// const pluginCachePath = `${pluginDataPath}cache/`;
if (!fs.existsSync(pluginDataPath))
    fs.mkdirSync(pluginDataPath);
// if (!fs.existsSync(pluginCachePath)) fs.mkdirSync(pluginCachePath);
var Red = Format.Red, White = Format.White, Aqua = Format.Aqua, Yellow = Format.Yellow, Green = Format.Green, Gray = Format.Gray, Gold = Format.Gold, DarkAqua = Format.DarkAqua, LightPurple = Format.LightPurple, DarkGreen = Format.DarkGreen, DarkBlue = Format.DarkBlue;
var builtInInstruments = new Map([
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
var playTasks = new Map();
var bossBarId = 627752937; // NbsPlayer九键(xd
function readNbs(name, callback) {
    var nbsPath = "".concat(pluginDataPath).concat(name);
    fs.readFile(nbsPath, function (err, data) {
        if (err)
            callback(false, err.stack);
        else
            callback(true, (0, nbs_js_1.fromArrayBuffer)(data.buffer));
    });
}
function stopPlay(xuid) {
    var taskId = playTasks.get(xuid);
    if (taskId) {
        clearInterval(taskId);
        var ret = playTasks["delete"](xuid);
        var pl = mc.getPlayer(xuid);
        if (pl)
            pl.removeBossBar(bossBarId);
        return ret;
    }
    return false;
}
/*
function formatMsTime(msTime: number): string {
  const ms = (msTime % 1000).toString()[0];
  const sec = Math.floor((msTime / 1000) % 60)
    .toString()
    .padStart(2, '0');
  const min = Math.floor(msTime / 1000 / 60).toString();
  return `${min}:${sec}.${ms}`;
}
*/
function getPlaySoundDataPack(bs, sound, position, volume, pitch) {
    // log(sound, ' | ', position, ' | ', volume, ' | ', pitch);
    bs.reset();
    bs.writeString(sound);
    bs.writeVarInt(Math.round(position.x * 8));
    bs.writeUnsignedVarInt(Math.round(position.y * 8));
    bs.writeVarInt(Math.round(position.z * 8));
    bs.writeFloat(volume);
    bs.writeFloat(pitch);
    return bs.createPacket(86);
}
function startPlay(player, nbsName) {
    var xuid = player.xuid;
    var playingTask = playTasks.get(xuid);
    if (playingTask)
        stopPlay(xuid);
    player.setBossBar(bossBarId, "".concat(Green, "\u89E3\u6790nbs\u6587\u4EF6\u2026\u2026"), 100, 4);
    readNbs(nbsName, function (ok, ret) {
        if (!ok) {
            player.tell("".concat(Red, "\u6587\u4EF6\u8BFB\u53D6\u51FA\u9519\uFF01\n").concat(ret), 0);
            player.removeBossBar(bossBarId);
            return;
        }
        if (!(ret instanceof nbs_js_1.Song))
            return;
        var errors = ret.errors, _a = ret.meta, name = _a.name, author = _a.author, originalAuthor = _a.originalAuthor, length = ret.length, instruments = ret.instruments, layers = ret.layers, timePerTick = ret.timePerTick;
        if (errors.length > 0) {
            player.tell("".concat(Red, "\u6587\u4EF6\u89E3\u6790\u51FA\u9519\uFF01\n").concat(errors.join('\n')), 0);
            player.removeBossBar(bossBarId);
            return;
        }
        var songDisplayName = Aqua;
        if (name) {
            songDisplayName += name;
            var displayAuthor = originalAuthor || author;
            if (displayAuthor)
                songDisplayName += "".concat(White, " - ").concat(Green).concat(displayAuthor);
        }
        else
            songDisplayName += nbsName;
        var totalLength = timePerTick * length;
        // const totalLengthStr = formatMsTime(totalLength);
        var totalNotes = 0;
        layers.forEach(function (l) {
            l.notes.forEach(function (n) {
                if (n)
                    totalNotes += 1;
            });
        });
        var playedNotes = 0;
        var passedTick = 0;
        var lastBossBarIndex = 0;
        var startTime = Date.now();
        var bs = new BinaryStream();
        var task = function () {
            var timeSpent = Date.now() - startTime;
            var nowTick = Math.floor(timeSpent / timePerTick);
            if (nowTick <= passedTick)
                return;
            var passedInterval = nowTick - passedTick;
            passedTick = nowTick;
            var pl = mc.getPlayer(xuid);
            if ((passedTick > length && totalNotes >= playedNotes) || !pl) {
                stopPlay(xuid);
                return;
            }
            var willPlay = [];
            var addWillPlay = function (layer) {
                var notes = layer.notes;
                var willPlayNotes = [];
                for (var i = 0; i < passedInterval; i += 1) {
                    var n = notes.shift();
                    if (n)
                        willPlayNotes.push(n);
                }
                willPlayNotes.forEach(function (n) {
                    var instrument = n.instrument, velocity = n.velocity, key = n.key, notePitch = n.pitch;
                    var volume = layer.volume;
                    var _a = instruments.loaded[instrument], pitch = _a.pitch, builtIn = _a.builtIn, insName = _a.meta.name;
                    var pos = pl.pos;
                    pos.y += 0.37;
                    var finalKey = (key || 45) + ((pitch || 45) - 45) + (notePitch || 0) / 100;
                    // log(finalKey);
                    playedNotes += 1;
                    willPlay.push(getPlaySoundDataPack(bs, (builtIn ? builtInInstruments.get(instrument) : insName) || '', pos, ((velocity || 100) / 100) * (volume / 100), Math.pow(2, ((finalKey - 45) / 12))));
                });
            };
            layers.forEach(addWillPlay);
            willPlay.forEach(function (p) { return pl.sendPacket(p); });
            // const timeSpentStr = formatMsTime(timeSpent);
            var bossBarIndex = Math.round((timeSpent / totalLength) * 100);
            if (bossBarIndex !== lastBossBarIndex) {
                lastBossBarIndex = bossBarIndex;
                pl.setBossBar(bossBarId, "".concat(Green, "\u25B6 ").concat(LightPurple, "NbsPlayer").concat(Gray, " | ").concat(songDisplayName), bossBarIndex, 3);
            }
            /*
            pl.tell(
              `${Green}▶ ${LightPurple}NbsPlayer\n` +
                `\n` +
                `${Yellow}${timeSpentStr} ${White}/ ${Gold}${totalLengthStr}` +
                `${Gray} | ` +
                `${Yellow}${playedNotes} ${White}/ ${Gold}${totalNotes}`,
              4
            );
            */
        };
        playTasks.set(xuid, setInterval(task, 0));
    });
}
/**
 * @param {Player} player
 */
function nbsForm(player) {
    var pageMax = 15;
    var musics = [];
    fs.readdirSync(pluginDataPath).forEach(function (v) {
        if (v.toLowerCase().endsWith('.nbs'))
            musics.push(v);
    });
    if (musics.length === 0) {
        player.sendModalForm("".concat(Aqua).concat(pluginName), "".concat(Green, "\u63D2\u4EF6\u6570\u636E\u76EE\u5F55\u5185\u8FD8\u6CA1\u6709\u6B4C\u66F2\u6587\u4EF6\u54E6\uFF01\u8D76\u5FEB\u53BB\u5BFB\u627Enbs\u97F3\u4E50\u6765\u64AD\u653E\u5427\uFF01"), "\u77E5\u9053\u4E86", "\u77E5\u9053\u4E86", function () { });
        return;
    }
    var search = function (param) {
        var paramL = param.toLowerCase().replace(' ', '');
        var result = [];
        musics.forEach(function (v) {
            if (v.toLowerCase().replace(' ', '').includes(paramL))
                result.push(v);
        });
        var form = mc.newSimpleForm();
        form = form
            .setTitle("".concat(Aqua).concat(pluginName))
            .setContent("".concat(Green, "\u641C\u5BFB\u5230 ").concat(Yellow).concat(result.length, " ").concat(Green, "\u6761") +
            "\u5173\u4E8E ".concat(Aqua).concat(param, " ").concat(Green, "\u7684\u7ED3\u679C"));
        result.forEach(function (v) {
            form = form.addButton("".concat(DarkAqua).concat(v));
        });
        player.sendForm(form, function (_, i) {
            if (i !== null && i !== undefined) {
                startPlay(player, result[i]);
            }
        });
    };
    var sendForm = function (page) {
        var maxPage = Math.ceil(musics.length / pageMax);
        var index = pageMax * (page - 1);
        var pageContent = musics.slice(index, index + pageMax);
        var pageUp = false;
        var pageDown = false;
        var form = mc.newSimpleForm();
        form
            .setTitle("".concat(Aqua).concat(pluginName))
            .setContent("".concat(Green, "\u9875\u6570 ").concat(Yellow).concat(page, " ").concat(White, "/ ").concat(Gold).concat(maxPage, " ").concat(Gray, "| ") +
            "".concat(Green, "\u603B\u6570 ").concat(Yellow).concat(musics.length))
            .addButton("".concat(DarkBlue, "\u641C\u7D22"))
            .addButton("".concat(DarkBlue, "\u8DF3\u9875"));
        if (page > 1) {
            form = form.addButton("".concat(DarkGreen, "<- \u4E0A\u4E00\u9875"));
            pageUp = true;
        }
        pageContent.forEach(function (v) {
            form = form.addButton("".concat(DarkAqua).concat(v));
        });
        if (page < maxPage) {
            form = form.addButton("".concat(DarkGreen, "\u4E0B\u4E00\u9875 ->"));
            pageDown = true;
        }
        player.sendForm(form, function (_, i) {
            if (i !== null && i !== undefined) {
                if (i === 0) {
                    var searchForm = mc
                        .newCustomForm()
                        .setTitle("".concat(Aqua).concat(pluginName))
                        .addInput('请输入搜索内容');
                    player.sendForm(searchForm, function (__, data) {
                        if (data) {
                            var param = data[0];
                            if (param) {
                                search(param);
                            }
                            else
                                player.tell("".concat(Red, "\u8BF7\u8F93\u5165\u641C\u7D22\u5185\u5BB9"));
                        }
                        else
                            sendForm(page);
                    });
                    return;
                }
                if (i === 1) {
                    if (maxPage < 2) {
                        player.sendModalForm("".concat(Aqua).concat(pluginName), "".concat(Red, "\u9875\u9762\u603B\u6570\u5C0F\u4E8E2\uFF0C\u65E0\u6CD5\u8DF3\u8F6C"), "\u77E5\u9053\u4E86", "\u77E5\u9053\u4E86", function () { return sendForm(page); });
                        return;
                    }
                    var toPageForm = mc
                        .newCustomForm()
                        .setTitle("".concat(Aqua).concat(pluginName))
                        .addSlider('请选择跳转到的页数', 1, maxPage, 1, page);
                    player.sendForm(toPageForm, function (__, data) {
                        if (data)
                            sendForm(data[0]);
                        else
                            sendForm(page);
                    });
                    return;
                }
                var fIndex = i - 2;
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
function trimQuote(str) {
    if (str && str.startsWith('"') && str.endsWith('"'))
        return str.slice(1, str.length - 1);
    return str;
}
(function () {
    var cmd = mc.newCommand('nbsplayer', '来首音乐嘛？', PermType.Any);
    cmd.setAlias('nbs');
    cmd.optional('filename', ParamType.RawText);
    cmd.overload(['filename']);
    cmd.setCallback(function (_, origin, out, result) {
        var player = origin.player;
        if (!player) {
            out.error('该命令只能由玩家执行');
            return false;
        }
        var filename = result.filename;
        if (filename) {
            var filePath = "".concat(pluginDataPath).concat(trimQuote(filename));
            if (!fs.existsSync(filePath)) {
                out.error('文件不存在！');
                return false;
            }
            startPlay(player, trimQuote(filename));
            return true;
        }
        nbsForm(player);
        return true;
    });
    cmd.setup();
})();
(function () {
    var cmd = mc.newCommand('nbsplay', '管理员播放指令');
    cmd.mandatory('player', ParamType.Player);
    cmd.mandatory('filename', ParamType.RawText);
    cmd.optional('forcePlay', ParamType.Bool);
    cmd.overload(['player', 'filename', 'forcePlay']);
    cmd.setCallback(function (_, __, out, result) {
        var player = result.player, filename = result.filename, forcePlay = result.forcePlay;
        var filePath = "".concat(pluginDataPath).concat(trimQuote(filename));
        if (player.length === 0) {
            out.error('玩家不在线');
            return false;
        }
        if (!fs.existsSync(filePath)) {
            out.error('文件不存在！');
            return false;
        }
        player.forEach(function (p) {
            if (forcePlay || !playTasks.get(p.xuid)) {
                startPlay(p, filename);
                out.success("\u6210\u529F\u4E3A ".concat(p.name, " \u64AD\u653E ").concat(filename));
                return;
            }
            out.error("\u73A9\u5BB6 ".concat(p.name, " \u6B63\u5728\u64AD\u653E\u4E2D\uFF0C\u64CD\u4F5C\u5931\u8D25"));
        });
        return true;
    });
    cmd.setup();
})();
(function () {
    var cmd = mc.newCommand('nbstop', '停止播放nbs', PermType.Any);
    cmd.overload();
    cmd.setCallback(function (_, origin, out) {
        var player = origin.player;
        if (!player) {
            out.error('该命令只能由玩家执行');
            return false;
        }
        if (stopPlay(player.xuid))
            return out.success('操作成功');
        out.error('操作失败');
        return false;
    });
    cmd.setup();
})();
(function () {
    var cmd = mc.newCommand('nbsisplaying', '玩家是否正在播放', PermType.Any);
    cmd.overload();
    cmd.setCallback(function (_, origin, out) {
        var player = origin.player;
        if (!player) {
            out.error('该命令只能由玩家执行');
            return false;
        }
        if (playTasks.get(player.xuid))
            return out.success('true');
        out.error('false');
        return false;
    });
    cmd.setup();
})();
mc.listen('onLeft', function (pl) { return stopPlay(pl.xuid); });
ll.registerPlugin(pluginName, '在服务器播放NBS音乐！', [1, 0, 0], {
    Author: 'student_2333',
    License: 'Apache-2.0'
});
