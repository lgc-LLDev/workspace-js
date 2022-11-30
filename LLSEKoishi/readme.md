<!-- markdownlint-disable MD033 -->

# LLSEKoishi

LLSE 中的 [Koishi](https://koishi.chat/) Launcher！

## 编译 & 打包

- 克隆整个存储库，在存储库根目录执行 `npm install`
- 在此目录运行 `npm run build`
- 将 `dist`、`res` 文件夹以及 `package.json` 打包成 `llplugin` 即可

## 安装

打包后以常规 NodeJS 插件安装即可

## 开发

Koishi 插件开发文档见 [这里](https://koishi.chat/guide/)

当你搞完自己的 Koishi 插件之后  
请把你的 Koishi 插件项目文件夹放在 `plugins/LLSEKoishi/plugins` 文件夹下  
再去修改配置文件让 LLSEKoishi 加载你的插件（方式见 [这里](https://koishi.chat/guide/plugin/index.html#%E5%9C%A8%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6%E4%B8%AD%E5%8A%A0%E8%BD%BD)）

LLSEKoishi 将会自动安装插件文件夹下所有 Koishi 插件 `package.json` 里声明的 `dependencies` 依赖项

## 配置文件

初次加载插件会自动写入样板配置，参考 [这里](res/koishi.yml)

## 注意事项

- 你可以在控制台中 npm install 再修改配置文件来安装其他 Koishi 插件
- 目前 LLSEKoishi 还不支持原生 Koishi 的一部分插件（包括 `console`），所以没有预装，如果有人能想办法适配，欢迎 PR ！
- LLSEKoishi 目前不能热重载，因为启动 Koishi 之后没法监听插件是否被卸载，导致 Koishi 依然在运行且占用着端口

## 联系我

QQ：3076823485  
吹水群：[1105946125](https://jq.qq.com/?_wv=1027&k=Z3n1MpEp)  
邮箱：<lgc2333@126.com>

## 赞助

感谢大家的赞助！你们的赞助将是我继续创作的动力！

- [爱发电](https://afdian.net/@lgc2333)
- <details>
    <summary>赞助二维码（点击展开）</summary>

  ![讨饭](https://raw.githubusercontent.com/lgc2333/ShigureBotMenu/master/src/imgs/sponsor.png)

  </details>

## 更新日志

还未正式发布，未来将会与 [OneBotBridge](../OneBotBridge) 同步发布
