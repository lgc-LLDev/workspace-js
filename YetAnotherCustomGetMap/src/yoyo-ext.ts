import axios from 'axios';
import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';
import { join, resolve } from 'path';

import { imgPath, pluginName } from './const';
import { extractMsgPlaintext, formatError } from './util';

import type {
  segment,
  AtElem,
  Client,
  GroupMessageEvent,
  ImageElem,
} from 'oicq';
import { config } from './config';

export type BindObj = { name?: string; qq?: string };

export interface ServerInfo {
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

export interface Bind {
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

export interface Yoyo {
  segment: typeof segment & {
    atall: () => AtElem;
  };
  // cqcode: any; // ???
  getinfo: () => ServerInfo;
  bind: Bind;
  listen: (
    eventName: string | symbol,
    listener: (...args: any[]) => void
  ) => void;
  client: Client;
}

let globalYoyo: Yoyo | null = null;

async function getPicLink(ev: GroupMessageEvent, arg: string) {
  const { message, group_id } = ev;
  const { client } = globalYoyo!;
  const imageList = message.filter((v) => v.type === 'image') as ImageElem[];

  if (!imageList.length) {
    client.sendGroupMsg(group_id, '请在消息后带一张图片');
    return;
  }

  const [{ url }] = imageList;
  if (!url) return;

  let picName = arg || String(Date.now());
  try {
    const res = await axios.get(url, { responseType: 'arraybuffer' });
    const { data, headers } = res;

    // console.log(headers);
    const extName = (headers['content-type'] as string).split('/').pop();
    picName += `.${extName}`;

    const picPath = join(imgPath, picName);
    if (existsSync(picPath)) {
      client.sendGroupMsg(group_id, '图片路径下已有同名文件');
      return;
    }

    await writeFile(picPath, data);
  } catch (e) {
    logger.error('保存图片失败');
    logger.error(formatError(e));
    client.sendGroupMsg(group_id, '保存图片失败，请重试');
    return;
  }

  client.sendGroupMsg(
    group_id,
    `图片保存成功！\n可以使用指令【/${config.mainCommand} get "${picName}"】来获取地图画`
  );
}

function apply(yoyo: Yoyo) {
  globalYoyo = yoyo;

  const { listen } = yoyo;
  listen('messageGroup', (ev: GroupMessageEvent) => {
    const matches: [
      string | RegExp,
      (ev: GroupMessageEvent, arg: string) => unknown
    ][] = [['上传地图画', getPicLink]];
    const message = extractMsgPlaintext(ev.message).trim();

    for (const [match, func] of matches) {
      const ok =
        typeof match === 'string'
          ? message.startsWith(match)
          : match.test(message);
      if (ok) {
        const arg = message.replace(match, '');
        func(ev, arg);
        return;
      }
    }
  });
}

const yoyoApiPath = resolve('plugins/nodejs/yoyorobot/llseapi.js');
if (existsSync(yoyoApiPath)) {
  logger.info('检测到已安装 YoyoRobot，装载 Yoyo 扩展……');
  // eslint-disable-next-line
  require(yoyoApiPath)(apply, pluginName);
}

export default {
  get yoyo() {
    return globalYoyo;
  },
};
