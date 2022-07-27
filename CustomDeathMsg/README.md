<!-- markdownlint-disable MD031 MD033 MD036 -->

# CustomDeathMsg

自定义玩家死亡消息

## 介绍

插件关闭了原版死亡提示消息，然后将你自定义的消息广播到玩家

### 注意

- 由于 LLSE 限制，插件只能取到伤害源实体信息，无法判断死亡方式等
- 卸载插件后请手动执行`gamerule showdeathmessages true`指令恢复原版死亡消息

## 安装方法

见[插件下载安装教程](../tutorial.md)

## 配置文件

插件配置文件位于`BDS根目录/plugins/CustomDeathMsg/config.json`（插件加载成功后自动生成）  
请根据下面 json 中的注释修改配置文件

### 配置中变量格式规范

- 字符串中的变量和 js 中的反引号字符串格式一致（毕竟是用 eval 实现的，你可以在里面实现判断等）（实际是我懒），为`${变量}`
- 当无伤害源时，可用`player`（玩家）变量，当有伤害源时，可用`player`（玩家）、`source`（伤害来源）变量
- `player`、`source`的属性参考[玩家对象 API](https://docs.litebds.com/zh_CN/Development/GameAPI/Player.html#%E7%8E%A9%E5%AE%B6%E5%AF%B9%E8%B1%A1-%E5%B1%9E%E6%80%A7)、[实体对象 API](https://docs.litebds.com/zh_CN/Development/GameAPI/Entity.html#%E5%AE%9E%E4%BD%93%E5%AF%B9%E8%B1%A1-%E5%B1%9E%E6%80%A7)
- 当提示文本格式化后为空，则会再换一条提示输出
  - 所以可以搞骚操作，比如`` ${player.permLevel >= 1 ? `我超，OP ${player.name} 暴毙了，快来嘲笑他（` : ''} ``
  - 但是至少要留一条必定会输出的，避免 bug

```jsonc
{
  // 当没有伤害源时的给出的提示
  "noSource": ["${player.name} 暴毙了"],

  // 当有伤害源时给出的提示
  "hasSource": ["${player.name} 被 ${source.name} 裁决了"]
}
```

## 联系我

QQ：3076823485  
吹水群：[1105946125](https://jq.qq.com/?_wv=1027&k=Z3n1MpEp)  
邮箱：<lgc2333@126.com>

## 赞助

感谢大家的赞助！你们的赞助将是我继续创作的动力！

- [爱发电](https://afdian.net/@lgc2333)
- <details>
    <summary>赞助二维码（点击展开）</summary>

  ![讨饭](https://raw.githubusercontents.com/lgc2333/ShigureBotMenu/master/src/imgs/sponsor.png)

  </details>

## 更新日志

- 无
