// LiteLoaderScript Dev Helper
/// <reference path="d:\Coding\LLSEAids/dts/llaids/src/index.d.ts"/>
/* global ll mc PermType ParamType */

const PLUGIN_NAME = 'SimpleTransferCmd';
const PLUGIN_VERSION = [0, 1, 0];

const cmdTransfer = mc.newCommand('transfer', '跨服指令', PermType.Any);
cmdTransfer.mandatory('host', ParamType.String);
cmdTransfer.mandatory('port', ParamType.Int);
cmdTransfer.optional('player', ParamType.Player);
cmdTransfer.overload(['host', 'port', 'player']);
cmdTransfer.setCallback(
  /**
   * @param {Command} _
   * @param {CommandOrigin} param1
   * @param {CommandOutput} out
   * @param {{host: string, port: number, player?: Player[]}} param3
   */
  (_, { player }, out, { host, port, player: selector }) => {
    if (!player && !selector) {
      out.error('请指定要跨服的玩家');
      return false;
    }
    if (player && selector && player.permLevel < 1) {
      out.error('仅OP可以传送其他人');
      return false;
    }

    const willTransfer = selector || [player];
    willTransfer.forEach((p) => p.transServer(host, port));
    return true;
  }
);
cmdTransfer.setup();

ll.registerPlugin(PLUGIN_NAME, '跨服指令', PLUGIN_VERSION, {
  Author: 'student_2333',
  License: 'Apache-2.0',
});
