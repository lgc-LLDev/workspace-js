import { existsSync } from 'fs';
import { resolve } from 'path';

import { pluginName } from './const';

type BindObj = { name?: string; qq?: string };

interface ServerInfo {
  /** 下一秒cpu使用率 */
  cpuUsage: number;
  /** 下一秒cpu空闲率 */
  cpuFree: number;
  /** gpu(nvidia)利用率 */
  gpuUsage: number;
  /** 当前空闲内存 */
  freeMem: number;
  /** 当前使用的内存 */
  busyMem: number;
  /** 当前使用的内存百分比 */
  freememPercentage: number;
  /** 总内存 */
  totalMem: number;
  /** 系统已经运行的秒 */
  sysUptime: number;
  /** 该进程已经运行的秒 */
  processUptime: number;
  /** 平台名称 */
  platformName: string;
  /** cpu数量 */
  cpuCount: number;
}

interface Bind {
  /**
   * 绑定游戏id
   * @param name 游戏id
   * @param qq qq号
   * @param force 是否强制绑定(如果已经绑定将覆盖)
   */
  nameBind(name: string, qq: string, force?: boolean): boolean;

  /**
   * 获取绑定信息
   * @param name 玩家id 或者 {name,qq}
   */
  getBind(name: string | BindObj): BindObj | null;

  /**
   * 删除绑定玩家
   * @param name 玩家id 或者 {name,qq}
   */
  delBind(name: string | BindObj): boolean | null;

  /**
   * 写入配置文件
   */
  writeBind(text?: string): boolean;

  /**
   * 读取配置文件
   */
  readBind(): null | { [x: string]: string };
}

interface Yoyo {
  segment: typeof import('oicq').segment & { atall: () => void };
  // cqcode: typeof import('oicq').cqcode; // ???
  getinfo: () => ServerInfo;
  bind: Bind;
  listen: (
    eventName: string | symbol,
    listener: (...args: any[]) => void
  ) => import('events').EventEmitter;
  client: import('oicq').Client;
}

function apply(yoyo: Yoyo) {
  const { client, segment, listen } = yoyo;
  listen('messageGroup', (ev: import('oicq').GroupMessageEvent) => {
    const {
      raw_message,
      group_id,
      sender: { user_id },
    } = ev;
    if (raw_message.toLowerCase().startsWith('hello')) {
      client.sendGroupMsg(group_id, [
        segment.at(user_id),
        '你好！这里是YoyoRobot~ 这条消息是从YetAnotherCustomGetMap发出来的！',
      ]);
    }
  });
}

const yoyoApiPath = resolve('plugins/nodejs/yoyorobot/llseapi.js');
if (existsSync(yoyoApiPath)) {
  logger.info('检测到已安装 YoyoRobot，装载 Yoyo 扩展……');
  // eslint-disable-next-line
  require(yoyoApiPath)(apply, pluginName);
}

export default {};
