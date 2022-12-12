<!-- markdownlint-disable MD033 -->

# LLSEKoishi

LLSE 中的 [Koishi](https://koishi.chat/) Launcher！

下载插件请去 [Releases](https://github.com/lgc2333/LLSEPlugins/releases)

<!--
## 编译 & 打包

- 克隆整个存储库，在存储库根目录执行 `npm install`
- 在此目录运行 `npm run build`
- 将 `dist`、`res` 文件夹以及 `package.json` 打包成 `llplugin` 即可
-->

## 安装

解压 Release 中的压缩包到服务器根目录即可

## 使用

安装并加载插件成功后，插件将会在 `plugins/LLSEKoishi` 文件夹下生成 `koishi.yml` 配置文件，请先按照该文件内指引修改配置之后重启服务器

本插件与 OneBotBridge 同步发布，一起打包到 Releases 发布的压缩包里  
这是一个基于本插件的 QQ 群服同步插件，该插件文档请看[这里](plugins/OneBotBridge/readme.md)  
本插件示例配置内也包含了该插件的配置项

如果你需要安装其他 Koishi 插件，可以使用 `npm` 安装，或者把插件项目文件夹放在 `plugins/LLSEKoishi/plugins` 文件夹下  
再去修改配置文件 `koishi.yml` 让 LLSEKoishi 加载你的插件（方式见 [这里](https://koishi.chat/guide/plugin/index.html#%E5%9C%A8%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6%E4%B8%AD%E5%8A%A0%E8%BD%BD)）

LLSEKoishi 将会自动安装插件文件夹下所有 Koishi 插件 `package.json` 里声明的 `dependencies` 依赖项

呃呃 不太会写文档 如果有什么问题的话直接[来问我](#联系我)吧

## 开发

Koishi 插件开发文档见 [这里](https://koishi.chat/guide/)

## 注意事项

- 目前 LLSEKoishi 还不支持原生 Koishi 的一部分插件（包括 `console`），所以没有预装，如果有人能想办法适配，欢迎 PR ！
- **LLSEKoishi 目前不能热重载**，因为启动 Koishi 之后没法监听插件是否被卸载，导致 Koishi 依然在运行且占用着端口
- 目前 LLSEKoishi 的部分特性可能与原生 Koishi 有差异，请各位稍微注意

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

暂无
