import { reloadConfig } from './config';
import { PLUGIN_NAME } from './const';

interface CmdMainCallbackData {
  enumReload?: 'reload';
}

function checkOp(player?: Player): boolean {
  return !player || player.isOP();
}

const ONLT_OP_TEXT = '此命令仅限OP执行';
const NO_CONSOLE_TEXT = '此命令无法在控制台中执行';

const cmdMain = mc.newCommand('blackbe', PLUGIN_NAME, PermType.Any);

cmdMain.setEnum('enumReload', ['reload']);
cmdMain.mandatory('enumReload', ParamType.Enum, 'enumReload', 1);
cmdMain.overload(['enumReload']);

cmdMain.overload([]);

cmdMain.setCallback((_, { player }, out, result: CmdMainCallbackData) => {
  const { enumReload } = result;

  if (enumReload) {
    if (checkOp(player)) {
      try {
        reloadConfig();
      } catch (e) {
        out.error(`出错了！\n${String(e)}`);
        return false;
      }
      out.success(`§a成功重载配置文件`);
      return true;
    }
    // else
    out.error(ONLT_OP_TEXT);
    return false;
  }

  out.error(`请输入子命令`);
  return false;
});

cmdMain.setup();
