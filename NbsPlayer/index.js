"use strict";
/* global ll mc system Format PermType ParamType logger BinaryStream */
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
function readNbs(name, callback) {
    var nbsPath = "".concat(pluginDataPath).concat(name);
    fs.readFile(nbsPath, function (err, data) {
        if (err)
            callback(false, "\u6253\u5F00\u6587\u4EF6\u51FA\u9519\n".concat(err.stack));
        else
            callback(true, (0, nbs_js_1.fromArrayBuffer)(data.buffer, { ignoreEmptyLayers: true }));
    });
}
function stopPlay(xuid) {
    var taskId = playTasks.get(xuid);
    if (taskId) {
        clearInterval(taskId);
        var ret = playTasks["delete"](xuid);
        var pl = mc.getPlayer(xuid);
        if (pl)
            pl.tell("".concat(Red, "\u25A0 ").concat(LightPurple, "NbsPlayer\n\n"), 4);
        return ret;
    }
    return false;
}
function formatMsTime(msTime) {
    var ms = (msTime % 1000).toString()[0];
    var sec = Math.floor((msTime / 1000) % 60)
        .toString()
        .padStart(2, '0');
    var min = Math.floor(msTime / 1000 / 60).toString();
    return "".concat(min, ":").concat(sec, ".").concat(ms);
}
function getPlaySoundDataPack(bs, sound, position, volume, pitch) {
    bs.reset();
    bs.writeString(sound);
    bs.writeVec3(position);
    bs.writeFloat(volume);
    bs.writeFloat(pitch);
    return bs.createPacket(86);
}
function startPlay(player, nbsName) {
    var xuid = player.xuid;
    var playingTask = playTasks.get(xuid);
    if (playingTask)
        stopPlay(xuid);
    player.tell("".concat(Green, "\u89E3\u6790nbs\u6587\u4EF6\u2026\u2026"), 4);
    readNbs(nbsName, function (ok, ret) {
        if (!ok) {
            player.tell("".concat(Red, "\u6587\u4EF6\u8F6C\u6362\u51FA\u9519\uFF01\n\u9519\u8BEF\u539F\u56E0\uFF1A ").concat(ret), 0);
            return;
        }
        if (!(ret instanceof nbs_js_1.Song))
            return;
        var _a = ret.meta, name = _a.name, author = _a.author, originalAuthor = _a.originalAuthor, length = ret.length, instruments = ret.instruments, layers = ret.layers, timePerTick = ret.timePerTick;
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
        var totalLengthStr = formatMsTime(totalLength);
        var totalNotes = 0;
        layers.forEach(function (v) { return (totalNotes += v.notes.length); });
        var playedNotes = 0;
        var bs = new BinaryStream();
        var startTime = Date.now();
        var task = function () {
            var pl = mc.getPlayer(xuid);
            if (totalNotes - playedNotes === 0 || !pl) {
                stopPlay(xuid);
                return;
            }
            var willPlay = [];
            layers.forEach(function (layer) {
                var notes = layer.notes;
                var n = notes.shift();
                if (n) {
                    var instrument = n.instrument, velocity = n.velocity, key = n.key, notePitch = n.pitch;
                    var volume = layer.volume;
                    var _a = instruments.loaded[instrument], pitch = _a.pitch, builtIn = _a.builtIn, insName = _a.meta.name;
                    var pos = pl.pos;
                    pos.y += 0.37;
                    var finalKey = (pitch || 45) + ((key || 45) - 45) + (pitch || 0) / 100;
                    willPlay.push(getPlaySoundDataPack(bs, (builtIn ? builtInInstruments.get(instrument) : insName) || '', pos, ((velocity || 100) / 100) * (volume / 100), Math.pow(2, (finalKey / 12))));
                }
            });
            // const {
            //   pos: { x, y, z },
            // } = pl;
            willPlay.forEach(function (p) { return pl.sendPacket(p); });
            var timeSpent = Date.now() - startTime;
            var timeSpentStr = formatMsTime(timeSpent);
            pl.tell("".concat(Green, "\u25B6 ").concat(LightPurple, "NbsPlayer\n") +
                "".concat(songDisplayName, "\n") +
                "".concat(Yellow).concat(timeSpentStr, " ").concat(White, "/ ").concat(Gold).concat(totalLengthStr) +
                "".concat(Gray, " | ") +
                "".concat(Yellow).concat(playedNotes, " ").concat(White, "/ ").concat(Gold).concat(totalNotes), 4);
        };
        playTasks.set(xuid, setInterval(task, timePerTick));
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
    cmd.overload();
    cmd.setup();
})();
(function () {
    var cmd = mc.newCommand('nbsisplaying', '玩家是否正在播放', PermType.Any);
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
    cmd.overload();
    cmd.setup();
})();
mc.listen('onLeft', function (pl) { return stopPlay(pl.xuid); });
ll.registerPlugin(pluginName, '在服务器播放NBS音乐！', [1, 0, 0], {
    Author: 'student_2333',
    License: 'Apache-2.0'
});
