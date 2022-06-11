# GoCQSync

一个依赖 [GoCQHTTP](https://github.com/Mrs4s/go-cqhttp) 的群服互通插件

## 使用方法

待更新

## 配置文件

插件配置文件位于`BDS根目录/plugins/GoCQSync/config.json`  
请根据下面 json 中的注释修改配置文件

```jsonc
{
  //连接GoCQ正向ws的url
  "ws_url": "ws://127.0.0.1:6700",

  // 管理员列表
  // 管理员可以用“/”开头的消息来执行控制台指令
  // 别问为什么用string，问就是ll的锅
  "superusers": ["1234567890"],

  // 启用群聊
  // 游戏内的聊天消息、进服退服提示都会发送到这些群聊
  // 同时只有这些群聊才会响应戳一戳查看服务器状态以及执行控制台指令
  "enable_groups": ["987654321"]
}
```

## 更新日志

- 1.0.1
  - 修复部分文本显示错误
  - 添加进服退服提示
- 1.0.2
  - bugfix
