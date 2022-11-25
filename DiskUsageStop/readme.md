<!-- markdownlint-disable MD036 MD033 -->

# DiskUsageStop

当你 BDS 所在硬盘分区使用量超过指定比例时停服

下载插件请去 [Releases](https://github.com/lgc2333/LLSEPlugins/releases)

_妈的，插件撞车了，但我还是给它写出来了，喜欢用哪个就用哪个吧_

# 介绍

功能不多，看截图

![1](readme/Screenshot_20221126-012130.png)

# 配置文件

配置文件路径 `plugins/DiskUsageStop/config.json`，初次加载插件会自动生成  
请注意实际的配置文件不能有注释

```jsonc
{
  // 检查硬盘容量的时间间隔（秒）
  "checkInterval": 60,

  // 当硬盘已用空间比例达到此值时关闭服务器
  // 0.95 为 95%
  "percent": 0.95,

  // 检测到硬盘已用空间已到指定比例时倒数关服的时长（秒）
  "stopInterval": 20,

  // 检测硬盘容量时是否在控制台输出信息
  "showDiskLog": true
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

  ![讨饭](https://raw.githubusercontent.com/lgc2333/ShigureBotMenu/master/src/imgs/sponsor.png)

  </details>

## 更新日志

暂无
