<!-- markdownlint-disable MD031 MD033 MD036 -->

# DeathQuery

死亡记录查询

## 介绍

### Features

- 死亡时播报  
  ![示例](readme/1.png)
- 查询、清空、记录（可以自定义上限）
  - 命令  
    ![示例](readme/2.png)
  - 简化的命令  
    ![示例](readme/3.png)
  - 查询界面  
    ![示例](readme/4.png)
  - 详细信息、伤害来源记录（如果有）  
    ![示例](readme/5.png)
  - 清空记录  
    ![示例](readme/6.png)

如果你想给这个插件提建议的话，欢迎在 github 提 issue！

## 安装方法

见[插件下载安装教程](tutorial.md)  
老旧的LL版本加载`DeathQuery.lxl.js`报错的，可以使用`DeathQuery_OldLXL.lxl.js`

## 配置文件

插件配置文件位于`BDS根目录/plugins/DeathQuery/config.json`（插件加载成功后自动生成）  
请根据下面 json 中的注释修改配置文件

```jsonc
{
  // 记录数上限（上限无法关闭）
  "maxRecords": 5
}
```

## 更新日志

无
