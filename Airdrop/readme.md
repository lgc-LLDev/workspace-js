<!-- markdownlint-disable MD033 MD036 -->

# Airdrop

看，空投！

<!-- 今天 16 周岁啦 可以祝我生日快乐吗 awa -->

## 介绍

这个插件可以在指定范围内让玩家召唤或者自动召唤一个物资箱子

插件会在空投生成时与空投箱被打开/破坏时公屏提示&播放音效  
空投箱上会有光柱（ParticleAPI 未加载时会换成烟花）、Boss 条会提示已有的空投箱位置，他们会在空投箱被打开/破坏时消失

为了预加载区块，插件会在召唤空投时生成一个模拟玩家，这个模拟玩家将在空投成功生成后自动断开连接

直接上截图介绍吧~

## 截图

![img](readme/QQ%E5%9B%BE%E7%89%8720230117041758.png)  
![img](readme/QQ%E5%9B%BE%E7%89%8720230117041804.png)  
![img](readme/QQ%E5%9B%BE%E7%89%8720230117041738.png)  
![img](readme/QQ%E5%9B%BE%E7%89%8720230117041823.png)

## 安装

将 `Airdrop.js` 放入 `plugins` 目录即可

详细配置请看下方

## 配置

实际的配置文件请不要有注释

### `plugins/Airdrop/config.json`

```jsonc
{
  // 空投自动生成的间隔 单位毫秒
  "interval": 7200000,

  // 玩家手动召唤空投时，空投会在指定的X坐标和Z坐标偏移内生成
  // 比如当这个值为 500 时，当你在 (0, 0) 手动召唤空投，
  // 最终空投会落在 (-500, -500) ~ (500, 500) 范围内
  "summonRadius": 500,

  // 所有空投的范围限制，格式 [[最小X轴, 最小Z轴], [最大X轴, 最大Z轴]]
  "range": [
    [-8000, -8000],
    [8000, 8000]
  ],

  // 全服能同时存在的最多的未打开的空投数量
  "maxAirdrops": 5,

  // 当空投落点寻找失败时，最大的重试次数
  "maxRetries": 3,

  // 当空投被打开并向全服广播附近玩家时，空投检索附近玩家的半径
  "nearbyDistance": 10,

  // 玩家可以用来手动触发空投的物品，会被消耗
  "triggerItem": "minecraft:chorus_fruit",

  // 当空投被召唤和被打开时，播放的音效 id
  "tipSoundId": "mob.enderdragon.growl",

  // 空投光柱颜色，只有当 ParticleAPI 加载时才有效
  // 参考 https://docs.litebds.com/zh-Hans/#/LLSEPluginDevelopment/GameAPI/Particle?id=%e7%b2%92%e5%ad%90%e9%a2%9c%e8%89%b2%e6%9e%9a%e4%b8%be
  "lightBeamColor": "Red",

  // 空投光柱每个点的大小，只有当 ParticleAPI 加载时才有效，可选 1，2，4，8，16
  "lightBeamWidth": 8,

  // 空投光柱每方块内的点数量，越高线条波浪越浅但是也可能会越掉帧
  "lightBeamDotCount": 4,

  // 空投奖励设置
  "award": [
    {
      // 物品 id
      "type": "minecraft:netherite_ingot",

      // 物品特殊值，可以不填
      "aux": 0,

      // 可能出现的概率
      "chance": 1,

      // 当物品在空投里出现后，物品可能出现的个数
      // 格式 [最少, 最多]
      "amountRange": [0, 2]
    },
    {
      // 当有 sNbt 项时，奖励将为此 SNBT 字符串对应的物品
      // 会忽略 NBT 指定的物品数量，最终奖励数量以 amountRange 配置为准
      "sNbt": "{\"Count\":1b,\"Damage\":0s,\"Name\":\"minecraft:diamond\",\"WasPickedUp\":0b}",

      // 同上
      "chance": 1,
      "amountRange": [1, 4]
    }
  ]
}
```

## 联系我

QQ：3076823485  
吹水群：[1105946125](https://jq.qq.com/?_wv=1027&k=Z3n1MpEp)  
邮箱：<lgc2333@126.com>

## 鸣谢

### [老杨](https://www.minebbs.com/members/laoyangnotfound.53026/)

- 插件点子（定制者）

## 赞助

感谢大家的赞助！你们的赞助将是我继续创作的动力！

- [爱发电](https://afdian.net/@lgc2333)
- <details>
    <summary>赞助二维码（点击展开）</summary>

  ![讨饭](https://raw.githubusercontent.com/lgc2333/ShigureBotMenu/master/src/imgs/sponsor.png)

  </details>

## 更新日志

### 0.1.4

- 接着 0.1.3 勉强修复了点 bug

### 0.1.3

- 勉强修复了一些 bug

### 0.1.2

- 当 `interval` 为 `0` 时不会自动召唤空投

### 0.1.1

- 修复 ParticleAPI 未加载时空投 y 轴坐标一直往上窜的问题
- 当空投召唤失败会返还给玩家召唤物品
