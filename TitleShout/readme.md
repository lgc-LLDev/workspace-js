# TitleShout

让玩家可以花费一些资源来在公屏上打出醒目 Title

## 指令

- `/shout <内容>`

## 配置文件

```jsonc
{
  // 要花费的资源类型
  // 目前只有 item 一种，表示物品
  "type": "item",

  // 当 type 为 item 时，消耗的物品
  "item": "minecraft:diamond",

  // 当 type 为 item 时，消耗的物品数量
  "amount": 5
}
```
