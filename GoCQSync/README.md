# GoCQSync

一个依赖 [GoCQHTTP](https://github.com/Mrs4s/go-cqhttp) 的群服互通插件

## 使用方法

待更新

## 配置文件

插件配置文件位于`BDS根目录/plugins/GoCQSync/config.json`  
请根据下面 json 中的注释修改配置文件

```jsonc
{
  //连接GoCQ正向ws的url：String
  "ws_url": "ws://127.0.0.1:6700",

  // 管理员列表：Array<String>
  // 管理员可以用“/”开头的消息来执行控制台指令
  // 别问为什么用string，问就是ll的锅
  "superusers": ["1234567890"],

  // 启用群聊：Array<String>
  // 游戏内的聊天消息、进服退服提示都会发送到这些群聊
  // 同时只有这些群聊才会响应戳一戳查看服务器状态以及执行控制台指令
  "enable_groups": ["987654321"],

  // 日志输出等级：Number
  // 见 https://docs.litebds.com/#/zh_CN/Development/ScriptAPI/Logger?id=%e6%a6%82%e5%bf%b5%ef%bc%9a%e5%85%b3%e4%ba%8e%e6%97%a5%e5%bf%97%e8%be%93%e5%87%ba%e7%ad%89%e7%ba%a7
  "log_level": 4
}
```

## 更新日志

- 0.1.1
  - 修复部分文本显示错误
  - 添加进服退服提示
- 0.1.2
  - bugfix
- 0.1.3
  - 报错优化
- 0.2.0
  - 修修补补小细节
  - 优化控制台日志输出
- 0.2.1
  - 支持配置日志输出等级
  - 优化重连
