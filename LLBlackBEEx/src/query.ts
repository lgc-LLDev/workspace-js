import {
  BlackBECommonInfo,
  BlackBEPrivateInfo,
  check,
  checkPrivate,
  getRepoByUuid,
} from './blackbe';
import { LocalBlackListItem, localList } from './config';
import { PLUGIN_NAME } from './const';
import { CustomFormEx } from './form-api';
import {
  wrapAsyncFunc,
  checkValInArray,
  delFormatCode,
  formatDate,
  fuzzyValIsInArray,
} from './util';

export type BlackBEQueryInfo = BlackBECommonInfo | BlackBEPrivateInfo;
export type BlackBEPrivInfoWithRespId = BlackBEPrivateInfo & {
  black_id: string;
};
export type BlackBEQueryInfoWithRespId =
  | BlackBECommonInfo
  | BlackBEPrivInfoWithRespId;

export function isBlackBEInfo(
  obj: LocalBlackListItem | BlackBEQueryInfo
): obj is BlackBEQueryInfo {
  return 'level' in obj;
}

export function isPrivateInfo(
  obj: BlackBEQueryInfoWithRespId
): obj is BlackBEPrivInfoWithRespId;
export function isPrivateInfo(
  obj: BlackBEQueryInfo
): obj is BlackBEPrivateInfo {
  return !('photos' in obj);
}

export async function queryBlackBE(
  param: string
): Promise<BlackBEQueryInfoWithRespId[]> {
  const [comm, priv] = await Promise.all([
    check({ name: param, qq: param, xuid: param, withToken: false }),
    checkPrivate({ name: param, qq: param, xuid: param }),
  ]);
  const ret: BlackBEQueryInfoWithRespId[] = [];

  if (comm.data.exist) ret.push(...comm.data.info);
  for (const repo of priv.data) {
    if (repo.exist)
      ret.push(...repo.info.map((v) => ({ ...v, black_id: repo.repo_uuid })));
  }

  return ret;
}

export function queryLocal(
  param: string,
  moreInfo = false
): LocalBlackListItem[] {
  const params = param.split(/\s/g);
  const ret: LocalBlackListItem[] = [];

  // 遍历列表中的对象
  for (const it of localList.list) {
    const { name, xuid, ips, clientIds } = it;
    const willCheck: (string | string[])[] = [name, xuid];
    if (moreInfo) willCheck.push(ips, clientIds);

    // 遍历待匹配的值
    for (const v of willCheck) {
      // 使用搜索词匹配 value
      if (
        checkValInArray(params, (pr) =>
          v instanceof Array ? fuzzyValIsInArray(v, pr) : pr.includes(v)
        )
      ) {
        ret.push(it);
      }
    }
  }

  return ret;
}

/**
 * @returns [ 等级描述，对应颜色 ]
 */
export function formatBlackBELvl(lvl: number): [string, string] {
  switch (lvl) {
    case 1:
      return ['有作弊行为，但未对其他玩家造成实质上损害', '§e'];
    case 2:
      return ['有作弊行为，且对玩家造成一定的损害', '§g'];
    case 3:
      return ['严重破坏服务器，对玩家和服务器造成较大的损害', '§c'];
    default:
      return ['未知', '§r'];
  }
}

export async function formatBlackBEInfo(
  obj: BlackBEQueryInfoWithRespId,
  moreInfo = false
): Promise<string> {
  const isPriv = isPrivateInfo(obj);
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
  if (isPriv && moreInfo) lines.push(`§2玩家电话§r： §b${obj.phone}`);
  if (isPriv) lines.push(`§2记录时间§r： §b${obj.time}`);
  lines.push(`§2记录UUID§r： §b${uuid}`);
  lines.push(`§2来源库§r： §b${repoName} （${black_id}）`);

  return lines.join('\n');
}

export function formatLocalInfo(
  obj: LocalBlackListItem,
  moreInfo = false
): string {
  const formatList = (li: string[]): string =>
    li.map((v) => `  - §b${v}§r`).join('\n');

  const { name, xuid, ips, endTime, clientIds, reason } = obj;
  const lines: string[] = [];

  lines.push(`§2玩家ID§r： §l§d${name}§r`);
  lines.push(`§2XUID§r： §b${xuid}`);
  lines.push(`§2记录原因§r： §b${reason}`);
  if (moreInfo)
    lines.push(`§2结束时间§r：\n${formatDate({ date: new Date(endTime) })}`);
  if (moreInfo) lines.push(`§2已记录IP§r：\n${formatList(ips)}`);
  if (moreInfo) lines.push(`§2已记录设备ID§r：\n${formatList(clientIds)}`);

  return lines.join('\n');
}

export async function query(param?: string, moreInfo = false): Promise<string> {
  param = param?.trim();
  if (!param) return `§c请输入要查询的内容`;

  const localResults: LocalBlackListItem[] = [];
  const blackBEResults: BlackBEQueryInfoWithRespId[] = [];
  try {
    localResults.push(...queryLocal(param, moreInfo));
    blackBEResults.push(...(await queryBlackBE(param)));
  } catch (e) {
    return `§c出错了！\n${String(e)}`;
  }

  if (!localResults.length && !blackBEResults.length)
    return `§6我们找遍了本地黑名单和 BlackBE，但是没有查询到任何结果 QAQ`;

  const localNum = localResults.length;
  const privNum = blackBEResults.filter(isPrivateInfo).length;
  const commNum = blackBEResults.length - privNum;

  const headingSuffixes: string[] = [];
  if (localNum) headingSuffixes.push(`§l§e${localNum} §r§a条本地库记录`);
  if (commNum) headingSuffixes.push(`§l§e${localNum} §r§a条云黑公有库记录`);
  if (privNum) headingSuffixes.push(`§l§e${localNum} §r§a条云黑私有库记录`);
  if (headingSuffixes.length > 1)
    headingSuffixes.push(`和 ${headingSuffixes.pop()}`);
  const heading =
    // prettier-ignore
    `§a为您找到了关于 §l§2${param} §r§a的 ${headingSuffixes.join('， ')}`;

  const texts = [
    ...localResults.map((v) => formatLocalInfo(v, moreInfo)),
    ...blackBEResults.map((v) => formatBlackBEInfo(v, moreInfo)),
  ];
  return `${heading}\n\n${texts.join(`§r-=-=-=-=-=-=-=-=-=-=-=-=-=-`)}`;
}

export async function queryFormAsync(player: Player, param?: string) {
  const op = player.isOP();

  if (!param) {
    const form = new CustomFormEx(PLUGIN_NAME);
    const res = await form
      .addLabel('§a请输入查询内容， 我们会帮你从本地库与 BlackBE 中查找结果')
      .addLabel(
        '§6请谨慎使用 XUID 查询来自 BlackBE 的记录：\n' +
          '由于历史遗留和 XUID 采集本身存在难度， 导致大部分条目没有记录 XUID， ' +
          '所以不推荐完全依赖 XUID 来判断玩家是否存在于黑名单'
      )
      .addInput('param', '', {
        placeholder: `输入 玩家ID / QQ号 / XUID${
          op ? ' / IP地址 / 设备ID' : ''
        }`,
      })
      .sendAsync(player);

    if (!res) return;
    ({ param } = res);
  }

  const resultForm = new CustomFormEx(PLUGIN_NAME);
  await resultForm.addLabel(await query(param, op)).sendAsync(player);
}

export function queryCmd(player?: Player, param?: string) {
  if (player) wrapAsyncFunc(queryFormAsync)(player, param);
  else
    wrapAsyncFunc(async () =>
      logger.info(delFormatCode(await query(param)))
    )();
}
