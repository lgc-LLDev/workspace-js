<!-- markdownlint-disable MD033 MD036 -->

# DailyFortune

今日运势

## 介绍

一个简单的今日运势插件，没啥好介绍的，详细请往下看

插件除了抽取今日运势外，还可以根据运势给予玩家奖励，支持经济与物品  
物品奖励给予特地做了防吞机制，如果玩家背包放不下物品，会在玩家坐标生成一个掉落物

## 截图

_此处截图仅做示例，实际上插件不会在同一天对同一位玩家显示不同的运势结果，除非配置文件被修改_

![img](readme/Screenshot_20230114-032446.png)  
![img](readme/Screenshot_20230114-014423.png)  
![img](readme/Screenshot_20230114-032538.png)  
![img](readme/Screenshot_20230114-032605.png)  
![img](readme/Screenshot_20230114-032627.png)

## 安装

将 `DailyFortune.js` 放入 `plugins` 目录即可

如果你要装载插件预设的运势文案和奖励配置，请复制 [`fortune.json`](./fortune.json) 文件至插件数据目录 `plugins/DailyFortune` 下

## 指令

### `fortune`

- 不带任何参数 - 抽取今日运势
- `dump` - 将手中的物品 NBT 以 SNBT 字符串格式导出至 `plugins/DailyFortune/dumped` 文件夹下，可以在配置文件中引用（需要 OP）
- `reload` - 重载插件配置（需要 OP）

## 配置

实际的配置文件请不要有注释

### `plugins/DailyFortune/config.json`

```jsonc
// 插件配置
{
  // 是否将玩家的今日运势全服广播（只有每日首次执行指令的时候会广播）
  "broadcast": true,

  // 是否启用运势奖励
  "enableAward": true
}
```

### `plugins/DailyFortune/player.json`

```jsonc
// 玩家历史运势数据
{
  // 玩家xuid
  "2535466512457742": {
    // 上次抽取时间
    "lastDate": "2023-01-13T19:26:26.000Z",

    "lastFortune": {
      // 上次抽取的文案 id
      "id": -6,

      // 上次抽取的文案下 content 列表的数组下标
      "contentIndex": 24
    }
  }
  // ...
}
```

### `plugins/DailyFortune/fortune.json`

```jsonc
// 运势文案及奖励设置
[
  {
    // 文案 id，会被记录到玩家历史运势数据
    "id": 1,

    // 显示的运势名称
    "title": "§e大吉",

    // 该运势搭配的文本，抽取运势的时候会从中随机选择一个展示
    "content": [
      "寄全身于好奇心，世界将更加宽阔",
      "曾经的努力和经验会成为他人眼中魅力的样子"
      // ...
    ],

    // 该运势对应的奖励，如果 enableAward 为 false 将不会给予到玩家
    "award": [
      {
        // 当 type 为物品 id 时，会给予玩家对应物品（理论上支持 addon 物品）
        "type": "minecraft:diamond",

        // 要给予给玩家的物品数量
        "amount": 16,

        // 物品特殊值，可以不填
        "aux": 0
      },
      {
        // 当有 sNbt 项时，将会给予玩家此 SNBT 字符串对应的物品，并忽略其他项
        "sNbt": "{\"Count\":1b,\"Damage\":0s,\"Name\":\"minecraft:diamond\",\"WasPickedUp\":0b}"
      },
      {
        // 当 type 为 money 时，会给予玩家 LLMoney 货币
        "type": "money",

        // 要给予玩家的货币数量
        "amount": 114
      },
      {
        // 当 type 为 score 时，会给予玩家计分板经济
        "type": "score",

        // 对应的计分板名称
        "scoreName": "money",

        // 要给予玩家的货币数量
        "amount": 514
      },
      {
        // 当 type 为 dumped 时
        // 会读取 plugins/DailyFortune/dumped 下的文件作为奖励项处理
        // 通常用于给予玩家 `fortune dump` 指令保存的带 NBT 的物品
        "type": "dumped",

        // 要读取的 dumped 文件夹下的文件名
        "filename": "1673637142566.json"
      }
      // ...
    ]
  }
  // ...
]
```

## 联系我

QQ：3076823485  
吹水群：[1105946125](https://jq.qq.com/?_wv=1027&k=Z3n1MpEp)  
邮箱：<lgc2333@126.com>

## 鸣谢

### [MinatoAquaCrews/nonebot_plugin_fortune](https://github.com/MinatoAquaCrews/nonebot_plugin_fortune/blob/master/nonebot_plugin_fortune/resource/fortune/copywriting.json)

- `fortune.json` 预设文案来源

### [xianyubb](https://www.minebbs.com/members/xianyubb.42760/)

- 插件点子（

## 赞助

感谢大家的赞助！你们的赞助将是我继续创作的动力！

- [爱发电](https://afdian.net/@lgc2333)
- <details>
    <summary>赞助二维码（点击展开）</summary>

  ![讨饭](https://raw.githubusercontent.com/lgc2333/ShigureBotMenu/master/src/imgs/sponsor.png)

  </details>

## 更新日志

暂无
