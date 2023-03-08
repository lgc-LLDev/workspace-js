<!-- markdownlint-disable MD033 -->

# Workspace

[![wakatime](https://wakatime.com/badge/user/b61b0f9a-f40b-4c82-bc51-0a75c67bfccf/project/d13550ef-4897-4e11-a57c-f45b2c6511e4.svg)](https://wakatime.com/badge/user/b61b0f9a-f40b-4c82-bc51-0a75c67bfccf/project/d13550ef-4897-4e11-a57c-f45b2c6511e4)
[![CodeFactor](https://www.codefactor.io/repository/github/lgc-llsedev/workspace/badge)](https://www.codefactor.io/repository/github/lgc-llsedev/workspace)

## 简介

这里是我开发 LLSE 插件的工作区

## 开发

### 克隆 & 更新

可以使用以下命令来克隆本工作区进行插件开发

```bash
git clone --recurse-submodules --depth=1 https://github.com/lgc-LLSEDev/workspace
```

可以使用下面的命令更新所有子模块

```bash
git submodule update --remote
```

### 安装工作区依赖

本人强烈推荐使用 `pnpm` 管理项目依赖，如果你没有安装，可以使用下面的命令来安装

```bash
npm i pnpm -g
```

然后可以使用以下命令来安装工作区依赖

```bash
pnpm i
```

如果你要工作区内编辑 NodeJS 项目，你需要进入项目文件夹，然后安装该项目对应的依赖，命令同上

### 编译

如果工作区内有项目使用 TypeScript 编写，通常可以进入项目文件夹，然后执行下面的命令来编译

```bash
pnpm build
```

如果需要监听项目改动并实时编译，通常可以使用以下命令

```bash
pnpm watch
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
