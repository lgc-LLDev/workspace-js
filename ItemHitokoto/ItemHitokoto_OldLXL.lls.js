/* eslint-disable no-restricted-syntax */
/* global mc network Format NbtCompound NbtString NbtInt */
// LiteLoaderScript Dev Helper
/// <reference path="E:\Coding\bds\.vscode\LLSEDevHelper/Library/JS/Api.js" />

// const pluginName = 'ItemHitokoto';
const pluginDescription = '给你手中的物品命名为一条随机一言';
// const pluginVersion = [0, 1, 1];

const { Red, Green, Clear, Aqua, Gray, White } = Format;
const hitoTypes = new Map([
  ['动画', 'a'],
  ['漫画', 'b'],
  ['游戏', 'c'],
  ['文学', 'd'],
  ['原创', 'e'],
  ['来自网络', 'f'],
  ['其他', 'g'],
  ['影视', 'h'],
  ['诗词', 'i'],
  ['网易云', 'j'],
  ['哲学', 'k'],
  ['抖机灵', 'l'],
]);

function formatHito(hitoObj) {
  const { hitokoto, from, from_who: fromWho } = hitoObj;
  return (
    `${Clear}${White}『${Aqua}${hitokoto}${White}』\n` +
    `${Gray}—— ${fromWho ? `${fromWho} ` : ''}「${from}」`
  );
}

function iterToArr(it) {
  const arr = [];
  for (const i of it) arr.push(i);
  return arr;
}

function cmd(pl, args) {
  const it = pl.getHand();
  if (it.isNull()) {
    pl.tell(`${Red}请手持一件物品`);
    return false;
  }

  const [type] = args;
  let typeChar = hitoTypes.get(type);
  if (type && !typeChar) {
    if (!iterToArr(hitoTypes.values()).includes(type)) {
      pl.tell(
        `${Red}错误的一言类型！\n` +
          `类型列表： ${iterToArr(hitoTypes.keys()).join('； ')}`
      );
      return false;
    }
    typeChar = type;
  }
  typeChar = typeChar || '';

  network.httpGet(`https://v1.hitokoto.cn/?c=${typeChar}`, (code, res) => {
    if (!(code === 200)) {
      pl.tell(`${Red}请求一言接口失败：返回状态非200`);
      return;
    }

    let ret;
    try {
      ret = JSON.parse(res);
    } catch {
      pl.tell(`${Red}请求一言接口失败：返回值解析错误`);
      return;
    }

    // https://www.minebbs.com/resources/customgetmap-custommap.4050/
    const nbt = it.getNbt();
    let tag = nbt.getTag('tag');
    if (!tag) tag = new NbtCompound();

    if (!tag.getTag('RepairCost')) tag.setTag('RepairCost', new NbtInt(0));

    const hito = formatHito(ret);
    const nameNbt = new NbtString(hito);
    const display = tag.getTag('display');
    if (!display) {
      tag.setTag(
        'display',
        new NbtCompound({
          Name: nameNbt,
        })
      );
    } else {
      display.setTag('Name', nameNbt);
      tag.setTag('display', display);
    }

    nbt.setTag('tag', tag);

    it.setNbt(nbt);
    pl.refreshItems();

    pl.tell(`${Green}成功！\n${hito}`);
  });
  return true;
}

mc.regPlayerCmd('itemhitokoto', pluginDescription, cmd);
mc.regPlayerCmd('ithito', pluginDescription, cmd);
