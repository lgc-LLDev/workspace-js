// import { isPromise } from 'util/types';
import {
  BlackBECommonData,
  BlackBECommonInfo,
  BlackBEPrivateData,
  BlackBEPrivInfoWithRespId,
  BlackBEQueryInfoWithRespId,
  BlackBEReturn,
  check,
  checkPrivate,
  formatBlackBELvl,
  getRepoByUuid,
} from './blackbe';
import { config, LocalBlackListItem, localList, saveLocalList } from './config';
import { PLUGIN_NAME } from './const';
import {
  CustomFormEx,
  CustomFormInputObject,
  sendModalFormAsync,
  SimpleFormEx,
} from './form-api';
import { checkValInArray, formatDate, wrapAsyncFunc } from './util';

export async function queryBlackBE(
  param: string
): Promise<[BlackBECommonInfo[], BlackBEPrivInfoWithRespId[]]> {
  const tasks = [
    check({ name: param, qq: param, xuid: param, withToken: false }),
    config.apiToken
      ? checkPrivate({ name: param, qq: param, xuid: param })
      : Promise.resolve(),
  ];

  // @ts-expect-error 故意需要
  const [comm, priv]: [
    BlackBEReturn<BlackBECommonData>,
    BlackBEReturn<BlackBEPrivateData[]>?
  ] = await Promise.all(tasks);

  const commInfo: BlackBECommonInfo[] = [];
  const privInfo: BlackBEPrivInfoWithRespId[] = [];
  if (comm) commInfo.push(...comm.data.info);
  if (priv) {
    for (const repo of priv.data) {
      if (repo.exist)
        privInfo.push(
          ...repo.info.map((v) => ({ ...v, black_id: repo.repo_uuid }))
        );
    }
  }

  return [commInfo, privInfo];
}

export function queryLocal(
  param: string,
  moreInfo = false,
  strict = false
): LocalBlackListItem[] {
  param = param.trim();
  const params = strict ? [param] : param.split(/\s/g);
  const ret: LocalBlackListItem[] = [];

  // 遍历列表中的对象
  for (const it of localList.list) {
    const { name, xuid, ips, clientIds } = it;
    const willCheck: (string | undefined)[] = [name, xuid];
    if (moreInfo) {
      if (ips) willCheck.push(...ips);
      if (clientIds) willCheck.push(...clientIds);
    }

    // 遍历待匹配的值
    for (const val of willCheck) {
      // 使用搜索词匹配 value
      if (
        val &&
        checkValInArray(params, (pr) =>
          strict ? val === pr : val.includes(pr)
        )
      ) {
        ret.push(it);
      }
    }
  }

  return ret;
}

export async function formatBlackBEInfo(
  obj: BlackBEQueryInfoWithRespId,
  moreInfo = false
): Promise<string> {
  const isPriv = 'phone' in obj;
  const { uuid, name, xuid, info, level, qq, black_id } = obj;

  const repo = await getRepoByUuid(black_id);
  const repoName = repo ? repo.name : '未知';
  const [lvlDesc, lvlColor] = formatBlackBELvl(level);

  const lines: string[] = [];
  lines.push(`§2玩家ID§r： §l§d${name}§r`);
  lines.push(
    `§2危险等级§r： ${lvlColor}等级 §l${level} §r${lvlColor}（${lvlDesc}）`
  );
  lines.push(`§2记录原因§r： §b${info}`);
  if (isPriv) lines.push(`§2违规服务器§r： §b${obj.server}`);
  lines.push(`§2XUID§r： §b${xuid}`);
  lines.push(`§2玩家QQ§r： §b${qq}`);
  if (isPriv && moreInfo)
    lines.push(`§2玩家电话§r： §b${obj.area_code} ${obj.phone}`);
  if (isPriv) lines.push(`§2记录时间§r： §b${obj.time}`);
  lines.push(`§2记录UUID§r： §b${uuid}`);
  lines.push(`§2来源库§r： §b${repoName} （${black_id}）`);

  return lines.join('\n');
}

export function formatLocalInfo(
  obj: LocalBlackListItem,
  moreInfo = false
): string {
  const formatList = (li?: string[]): string =>
    li && li.length ? `\n${li.map((v) => `  - §b${v}§r`).join('\n')}` : '§b无';

  const { name, xuid, ips, endTime, clientIds, reason } = obj;
  const lines: string[] = [];

  lines.push(`§2玩家ID§r： §l§d${name ?? '未知'}§r`);
  lines.push(`§2XUID§r： §b${xuid ?? '未知'}`);
  lines.push(`§2记录原因§r： §b${reason ?? '无'}`);
  if (moreInfo)
    lines.push(
      `§2结束时间§r： §b${
        endTime ? formatDate({ date: new Date(endTime) }) : '永久'
      }`
    );
  if (moreInfo) lines.push(`§2已记录IP§r： ${formatList(ips)}`);
  if (moreInfo) lines.push(`§2已记录设备ID§r： ${formatList(clientIds)}`);

  return lines.join('\n');
}

// function isBlackBECommonInfo(obj: any): obj is BlackBECommonInfo {
//   return obj.black_id === '1';
// }

// function isBlackBEPrivInfoWithRespId(
//   obj: any
// ): obj is BlackBEPrivInfoWithRespId {
//   return obj.black_id && obj.black_id !== '1';
// }

export type QueryResultTypes = 'common' | 'private' | 'local';

export interface QueryResultCommonFormatterArg {
  type: 'common';
  value: BlackBECommonInfo;
}

export interface QueryResultPrivateFormatterArg {
  type: 'private';
  value: BlackBEPrivInfoWithRespId;
}

export interface QueryResultLocalFormatterArg {
  type: 'local';
  value: LocalBlackListItem;
}

export type QueryResultFormatterArg =
  | QueryResultCommonFormatterArg
  | QueryResultPrivateFormatterArg
  | QueryResultLocalFormatterArg;

export const queryResultFormatter = ({
  type,
  value,
}: QueryResultFormatterArg): [string, string?] => {
  const { name, xuid } = value;

  let line1 = '';
  if (type === 'common') line1 = '§2BlackBE 公有库';
  else if (type === 'private') line1 = '§3BlackBE 私有库';
  else line1 = '§5本地库';

  const line2 = `§6${name ?? xuid ?? '未知'}`;

  if ('level' in value) {
    const { level } = value;
    const lvlColor = formatBlackBELvl(level)[1];
    line1 += `§7 | ${lvlColor}等级 ${level}`;
  }

  return [`${line1}\n${line2}`];
};

export function setupFunctionalityForm<
  T extends [string, ((...args: any[]) => any | Promise<any>) | null][]
>(buttons?: T) {
  const form = new SimpleFormEx(buttons);
  form.title = PLUGIN_NAME;
  form.formatter = (v) => [`§3${v[0]}`];
  return form;
}

/**
 * 返回 false 代表按下表单内返回按钮 (null)
 */
export async function processListFormReturn(res: any): Promise<boolean> {
  if (res) {
    const [, func] = res;
    if (!func) return false;

    /* const cb = */ func();
    // if (isPromise(cb)) await cb;
  }
  return true;
}

export function delLocalListItem(obj: LocalBlackListItem): boolean {
  const { list } = localList;
  const deleted = list.splice(list.indexOf(obj), 1);
  saveLocalList();
  return !!deleted.length;
}

export async function localItemForm(
  player: Player,
  obj: LocalBlackListItem,
  moreInfo = false
): Promise<boolean> {
  const delItem = async () => {
    if (
      await sendModalFormAsync(
        player,
        PLUGIN_NAME,
        '§6真的要删除这条黑名单项目吗？\n§c删前请三思！！！'
      )
    ) {
      player.tell(
        delLocalListItem(obj)
          ? '§a删除成功！'
          : '§c删除失败！未找到该黑名单项目'
      );
    } else {
      player.tell('§6删除操作已取消');
    }
  };

  const editTime = async () => {
    const res = await new CustomFormEx(PLUGIN_NAME)
      .addSwitch('forever', '是否永久封禁', !obj.endTime)
      .addInput(
        'time',
        '如果不是永久封禁，请输入从现在开始要封禁的时间（单位分钟）'
      )
      .sendAsync(player);

    if (res) {
      const { forever, time } = res;
      const timeNum = Number(time);
      if ((!timeNum || timeNum <= 0) && !forever) {
        await sendModalFormAsync(
          player,
          PLUGIN_NAME,
          '§c请输入正确的封禁时间！',
          '§a知道了',
          '§a知道了'
        );
        editTime();
        return;
      }

      delLocalListItem(obj);
      obj.endTime = forever
        ? undefined
        : new Date(Date.now() + timeNum * 60 * 1000).toJSON();

      localList.list.push(obj);
      saveLocalList();
      player.tell('§a操作成功！');
    } else {
      player.tell('§6修改操作已取消');
    }
  };

  const form = setupFunctionalityForm([['返回', null]]);
  form.content = formatLocalInfo(obj, moreInfo);
  if (moreInfo)
    form.buttons.unshift(['删除条目', delItem], ['修改封禁时间', editTime]);
  // eslint-disable-next-line no-return-await
  return await processListFormReturn(await form.sendAsync(player));
}

export async function blackBEItemForm(
  player: Player,
  obj: BlackBECommonInfo | BlackBEPrivInfoWithRespId,
  moreInfo = false
): Promise<boolean> {
  const form = setupFunctionalityForm([['返回', null]]);
  form.content = await formatBlackBEInfo(obj, moreInfo);
  // eslint-disable-next-line no-return-await
  return await processListFormReturn(await form.sendAsync(player));
}

export async function queryResultForm(
  player: Player,
  param?: string,
  moreInfo = false
) {
  param = param?.trim();
  if (!param) {
    player.tell(`§c请输入要查询的内容`);
    return;
  }

  player.tell(`§a请您稍安勿躁，我们正在努力查询中！`);
  const localRes: LocalBlackListItem[] = [];
  const blackBECommRes: BlackBECommonInfo[] = [];
  const blackBEPrivRes: BlackBEPrivInfoWithRespId[] = [];
  try {
    localRes.push(...queryLocal(param, moreInfo));
    if (!config.disableBlackBE) {
      const [comm, priv] = await queryBlackBE(param);
      blackBECommRes.push(...comm);
      blackBEPrivRes.push(...priv);
    }
  } catch (e) {
    player.tell(`§c出错了！\n${String(e)}`);
  }

  const localNum = localRes.length;
  const privNum = blackBEPrivRes.length;
  const commNum = blackBECommRes.length;

  if (!localNum && !privNum && !commNum) {
    player.tell(
      `§6很抱歉，我们找遍了本地黑名单${
        config.disableBlackBE ? '' : '和 BlackBE'
      }，但是没有查询到任何结果 QAQ`
    );
    return;
  }

  const headingSuffixes: string[] = [];
  if (localNum) headingSuffixes.push(`§l§e${localNum} §r§a条本地库记录`);
  if (commNum) headingSuffixes.push(`§l§e${commNum} §r§a条云黑公有库记录`);
  if (privNum) headingSuffixes.push(`§l§e${privNum} §r§a条云黑私有库记录`);
  if (headingSuffixes.length > 1)
    headingSuffixes.push(`和 ${headingSuffixes.pop()}`);
  const heading =
    // prettier-ignore
    `§a为您找到了关于 §l§2${param} §r§a的 ${headingSuffixes.join('， ')}`;

  const form = new SimpleFormEx([
    ...localRes.map((value) => ({ type: 'local', value })),
    ...blackBECommRes.map((value) => ({ type: 'common', value })),
    ...blackBEPrivRes.map((value) => ({ type: 'private', value })),
  ] as QueryResultFormatterArg[]);
  form.title = PLUGIN_NAME;
  form.canTurnPage = true;
  form.canJumpPage = true;
  form.content = `${heading}\n\n${form.content}`;
  form.formatter = queryResultFormatter;

  const sendTask = async () => {
    const res = await form.sendAsync(player);
    if (res) {
      const { type, value } = res;
      const infoRes = await (type === 'local'
        ? localItemForm(player, value, moreInfo)
        : blackBEItemForm(player, value, moreInfo));
      if (infoRes === false) sendTask();
    }
  };
  await sendTask();
}

export async function queryFormAsync(player: Player, param?: string) {
  const op = player.isOP();

  if (!param) {
    let form: CustomFormEx<{ param: CustomFormInputObject }> = new CustomFormEx(
      PLUGIN_NAME
    );
    form = form.addLabel(
      `§a请输入查询内容， 我们会帮你从本地库${
        config.disableBlackBE ? '' : '与 BlackBE '
      }中查找结果`
    );
    if (!config.disableBlackBE) {
      form.addLabel(
        '§6请谨慎使用 XUID 查询来自 BlackBE 的记录：\n' +
          '由于历史遗留和 XUID 采集本身存在难度， 导致大部分条目没有记录 XUID， ' +
          '所以不推荐完全依赖 XUID 来判断玩家是否存在于黑名单'
      );
    }
    form = form.addInput('param', '', {
      placeholder: `输入 玩家ID${
        config.disableBlackBE ? '' : ' / QQ号'
      } / XUID${op ? ' / IP地址 / 设备ID' : ''}`,
    });
    const res = await form.sendAsync(player);

    if (!res) return;
    ({ param } = res);
  }

  await queryResultForm(player, param, op);
}

export function queryCmd(player: Player, param?: string) {
  wrapAsyncFunc(queryFormAsync)(player, param);
}
