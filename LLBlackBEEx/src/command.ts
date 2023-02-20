import { BlackBECommonData, BlackBEReturn, check } from './blackbe';
import { reloadConfig } from './config';
import { PLUGIN_NAME } from './const';
import { delFormatCode } from './util';

interface CmdMainCallbackData {
  enumReload?: 'reload';

  enumQuery?: 'query';
  queryString?: string;
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

cmdMain.setEnum('enumQuery', ['query']);
cmdMain.mandatory('enumQuery', ParamType.Enum, 'enumQuery', 1);
cmdMain.optional('queryString', ParamType.String);
cmdMain.overload(['enumQuery', 'queryString']);

cmdMain.overload([]);

cmdMain.setCallback((_, { player }, out, result: CmdMainCallbackData) => {
  const { enumReload, enumQuery, queryString } = result;

  function outputMsgInTimeout(msg: string, error = false) {
    if (!player) {
      msg = delFormatCode(msg);
      if (error) logger.error(msg);
      else logger.info(msg);
    } else {
      player.tell(`${error ? `§c` : ''}${msg}`);
    }
  }

  if (enumReload) {
    if (!checkOp(player)) {
      out.error(ONLT_OP_TEXT);
      return false;
    }

    try {
      reloadConfig();
    } catch (e) {
      out.error(`出错了！\n${String(e)}`);
      return false;
    }
    out.success(`§a成功重载配置文件`);
    return true;
  }

  if (enumQuery) {
    // 简单写一下，测试用
    const query = queryString?.trim();
    if (!query) {
      out.error(`请输入查询内容`);
      return false;
    }

    setTimeout(async () => {
      let res: BlackBEReturn<BlackBECommonData>;
      try {
        res = await check({ name: query, qq: query, xuid: query });
      } catch (e) {
        outputMsgInTimeout(`出错了！\n${String(e)}`, true);
        return;
      }
      outputMsgInTimeout(`§a查询成功§r\n${JSON.stringify(res, null, 2)}`);
    });
    return true;
  }

  out.error(`请输入子命令`);
  return false;
});

cmdMain.setup();
