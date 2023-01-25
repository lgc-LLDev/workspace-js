import { config, reloadConfig } from './config';
import { pluginName } from './const';
import { formFiles, formGet } from './form';
import { mapGetControls } from './give-map';
import { callAsyncLogErr, formatError } from './util';

interface CmdGetMapCallback {
  enumGet?: 'get';
  fileName?: string;
  // enumNext?: 'next';
  // enumPrevious?: 'previous';
  enumJump?: 'jump';
  jumpIndex?: number;
  enumStop?: 'stop';
  enumReload?: 'reload';
}

const cmdGetMap = mc.newCommand(config.mainCommand, pluginName, PermType.Any);

cmdGetMap.setEnum('enumGet', ['get']);
// cmdGetMap.setEnum('enumNext', ['next']);
// cmdGetMap.setEnum('enumPrevious', ['previous']);
cmdGetMap.setEnum('enumJump', ['jump']);
cmdGetMap.setEnum('enumStop', ['stop']);
cmdGetMap.setEnum('enumReload', ['reload']);

cmdGetMap.mandatory('fileName', ParamType.String);
cmdGetMap.mandatory('enumGet', ParamType.Enum, 'enumGet', 1);
// cmdGetMap.mandatory('enumNext', ParamType.Enum, 'enumNext', 1);
// cmdGetMap.mandatory('enumPrevious', ParamType.Enum, 'enumPrevious', 1);
cmdGetMap.mandatory('enumJump', ParamType.Enum, 'enumJump', 1);
cmdGetMap.mandatory('jumpIndex', ParamType.Int);
cmdGetMap.mandatory('enumStop', ParamType.Enum, 'enumStop', 1);
cmdGetMap.mandatory('enumReload', ParamType.Enum, 'enumReload', 1);

cmdGetMap.overload([]);
cmdGetMap.overload(['enumGet', 'fileName']);
// cmdGetMap.overload(['enumNext']);
// cmdGetMap.overload(['enumPrevious']);
cmdGetMap.overload(['enumJump', 'jumpIndex']);
cmdGetMap.overload(['enumStop']);
cmdGetMap.overload(['enumReload']);

cmdGetMap.setCallback((_, origin, out, res: CmdGetMapCallback) => {
  const {
    enumGet,
    fileName,
    // enumNext,
    // enumPrevious,
    enumJump,
    jumpIndex,
    enumStop,
    enumReload,
  } = res;
  const { player } = origin;

  // reload指令仅OP可用
  if (enumReload && player && player.permLevel < 1) {
    out.error('此命令仅OP可用');
    return;
  }

  if (player && !enumReload) {
    // 有玩家 非reload指令
    if (/* enumNext || enumPrevious || */ enumJump || enumStop) {
      // jump和stop指令
      const ctrl = mapGetControls[player.xuid];
      if (!ctrl) {
        out.error('目前没有正在进行中的给予任务');
        return;
      }

      const { /* addMapIndex, */ stopGive, jumpMapIndex } = ctrl;
      if (enumStop) {
        stopGive(player);
      }
      // else if (enumNext || enumPrevious) {
      //   addMapIndex(player, !!enumNext);
      // }
      else if (enumJump) {
        jumpMapIndex(player, (jumpIndex as number) - 1); // 从0开始
      }
    }
    // 下面是get和主指令
    else if (Object.keys(mapGetControls).includes(player.xuid)) {
      // 如果存在玩家的控制地图给予函数（有地图给予进程运行中）
      out.error('已有获取地图任务运行中，请先停止');
    } else if (enumGet) {
      // 指令 get <文件名> 直接调用图片处理函数
      if (fileName) callAsyncLogErr(formGet)(player, fileName);
    } else {
      // 无参数，调用主表单
      callAsyncLogErr(formFiles)(player);
    }
  } else if (enumReload) {
    // 重载配置（无论调用者是不是玩家）
    try {
      reloadConfig();
    } catch (e) {
      out.error(`重载配置失败！\n${formatError(e)}`);
      return;
    }
    out.success('重载配置成功！更改指令名称后重启服务器才能生效！');
  } else {
    // 没有玩家 也不是重载配置
    out.error('此命令仅限玩家执行');
  }
});
cmdGetMap.setup();
