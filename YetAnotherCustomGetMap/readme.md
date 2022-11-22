<!-- markdownlint-disable MD033 -->

# YetAnotherCustomGetMap

另一个更易用的 [CustomMap](https://github.com/yhzx233/CustomMap) 辅助插件！  
下载本插件请去 [Releases](https://github.com/lgc2333/LLSEPlugins/releases)

本插件前置：[CustomMap](https://github.com/yhzx233/CustomMap)

## 介绍

插件使用 [Jimp](https://github.com/oliver-moran/jimp) 库来处理图片以及生成地图画二进制文件，**不需要借助其他程序**  
但缺点是**处理图片的时候会卡服**  
（性能更好的 [sharp](https://github.com/lovell/sharp) 库会崩服 悲）

插件支持的图片格式：bmp、gif、jpeg、png、tiff，**不支持** webp

直接上截图，顺便介绍一下插件

## 截图

**插件指令**  
YetAnotherCustomGetMap -> YACGM，你也可以在配置文件中更改命令名称  
![1](readme/Screenshot_20221123-043648.png)

**图片列表**  
![2](readme/Screenshot_20221123-043714.png)

**选择文件后图片处理方式选择表单**  
可选 宽高、处理方式（裁剪/拉伸/保留白边）、处理后水平垂直位置、缩放图片使用的插值法（最近邻/双线性/双三次/埃尔米特/贝塞尔）  
![3](readme/Screenshot_20221123-043823.png)  
![4](readme/Screenshot_20221123-043828.png)

**获取地图演示**  
受到 [CustomGetMap](https://www.minebbs.com/resources/customgetmap-custommap.4050/) 插件的启发（因为那个插件一次给全部地图很蛋疼），我把插件的给地图逻辑设计成了当空出主手时才会按顺序给一张，还加上了当前已给予的地图信息的提示，这样当拼一些大地图的时候就不会那么蛋疼了  
如果你搞乱了顺序，可以随时使用 `yacgm jump <地图序号>` 跳转到某一张地图  
![5](readme/Screenshot_20221123-043901.png)  
![6](readme/Screenshot_20221123-044107.png)  
![7](readme/Screenshot_20221123-044339.png)
![8](readme/Screenshot_20221123-044247.png)

## 使用

1. 先去 [Releases](https://github.com/lgc2333/LLSEPlugins/releases) 下载本插件，放在插件文件夹下，开服
2. 插件加载成功后会在插件文件夹内生成 `YetAnotherCustomGetMap/img` 文件夹，把图片文件放进里面就可以在插件菜单里看到了

## 指令

### `yacgm`（这个指令可以在配置文件中修改）

- 不带任何参数 - 打开插件主界面
- `get <fileName:string>` - 直接选择指定的文件，弹出图片处理表单
  - `fileName` - 图片文件名，需要带后缀，文件需要在插件的图片文件夹中
- `jump <jumpIndex:int>` - 在获取地图的过程中，直接跳转到指定序号的地图
  - `jumpIndex` - 要跳转到的地图序号（序号从 1 开始）
- `stop` - 在获取地图的过程中，停止获取地图
- `reload` - 重载插件配置（必须 OP 才能执行）

## 配置文件

配置文件路径：`plugins/YetAnotherCustomGetMap/config.json`  
请按照下面的注释修改配置文件  
注意：实际配置文件里**不能有注释**！

```jsonc
{
  // 插件指令名称，修改后需要重启服务器
  "mainCommand": "yacgm",

  // 是否只有OP才能使用插件指令
  // 此配置不对 `yacgm reload` 指令生效
  "onlyOP": true,

  // 插件菜单每页展示的文件数量
  "pageLimit": 15
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
