//LiteXLoader Dev Helper
/// <reference path="c:\Users\Administrator\.vscode\extensions\moxicat.llscripthelper-1.0.1\lib/Library/JS/Api.js" />

plInfo = {
    name: 'BlackBEQuery',
    description: '在游戏内查询BlackBE违规记录',
    version: { major: 1, minor: 0, revision: 1 },
    other: { author: 'student_2333', license: 'Apache-2.0' },
};
ll.registerPlugin(
    plInfo.name,
    plInfo.description,
    plInfo.version,
    plInfo.other
);

/**
 * 格式化API返回值
 * @param {Object} data
 */
function parseAPIReturn(data) {
    switch (data.level) {
        case 1:
            lvl = '有作弊行为，但未对其他玩家造成实质上损害';
            color = 'e';
            break;
        case 2:
            lvl = '有作弊行为，且对玩家造成一定的损害';
            color = '6';
            break;
        case 3:
            lvl = '严重破坏服务器，对玩家和服务器造成较大的损害';
            color = 'c';
            break;
        default:
            lvl = '未知';
            color = 'r';
            break;
    }
    return (
        `§2玩家ID§r：§l§d${data.name}§r\n` +
        `§2危险等级§r：§${color}等级 §l${data.level} §r§${color}（${lvl}）\n` +
        `§2记录原因§r：§b${data.info}\n` +
        `§2XUID§r：§b${data.xuid}\n` +
        `§2玩家QQ§r：§b${data.qq}\n` +
        `§2记录UUID§r：§b${data.uuid}`
    );
}

/**
 * 格式化返回数据，返回结果文本
 * @param {object} retJson
 */
function parseResult(retJson) {
    if (retJson.success) {
        if (retJson.data.exist) {
            li = retJson.data.info;
            tmpLi = [
                `§a为您查询到关于 §l§2${query} §r§a的 §l§e${li.length} §r§a条相关记录：`,
            ];
            li.forEach((i) => {
                tmpLi.push('§r-=-=-=-=-=-=-=-=-=-=-=-=-=-', parseAPIReturn(i));
            });
            content = tmpLi.join('\n');
        } else {
            content =
                `§a未查询到 §l§b${query} §r§a的记录§r：` +
                `[§6${retJson.status}§r] §d${retJson.message}`;
        }
    } else {
        content = `§a查询失败§r：[§6${retJson.status}§r] §d${retJson.message}`;
    }
    return content;
}

/**
 * 发送查询结果表单
 * @param {Player} pl 玩家
 * @param {string} query 查询内容
 */
function formResult(pl, query) {
    query = query.trim();
    encodedQuery = encodeURIComponent(query);
    network.httpGet(
        'https://api.blackbe.xyz/openapi/v3/check/' +
            `?name=${encodedQuery}&qq=${encodedQuery}&xuid=${encodedQuery}`,
        (_, ret) => {
            try {
                retJson = JSON.parse(ret);
                content = parseResult(retJson);
            } catch (e) {
                content = `§4格式化返回Json时出错！\n${e.stack}`;
            }
            pl.sendForm(
                mc
                    .newCustomForm()
                    .setTitle('§bBlackBEQuery§r - §aResult')
                    .addLabel(content),
                () => undefined
            );
        }
    );
}

/**
 * 发送查询输入表单
 * @param {Player} pl
 */
function formQuery(pl) {
    pl.sendForm(
        mc
            .newCustomForm()
            .setTitle('§bBlackBEQuery§r - §aInput')
            .addLabel('§a请输入查询内容')
            .addLabel(
                '§6请谨慎使用XUID查询：由于历史遗留和XUID采集本身存在难度，' +
                    '导致大部分条目没有记录XUID，所以不推荐依赖XUID来判断玩家是否存在于黑名单'
            )
            .addInput('', 'XboxID/QQ号/XUID'),
        (pl, ret) => {
            if (ret[2]) {
                formResult(pl, ret[2]);
            } else {
                pl.sendText('§c请输入查询内容');
            }
        }
    );
}

mc.regPlayerCmd('blackbe', '查询BlackBE违规记录', (pl, args) => {
    if (args[0]) {
        formResult(pl, args.join(' '));
    } else {
        formQuery(pl);
    }
});

log(
    'Load Successfully, Version: ' +
        `${plInfo.version.major}.${plInfo.version.minor}.${plInfo.version.revision}, ` +
        `Author: ${plInfo.other.author}`
);
