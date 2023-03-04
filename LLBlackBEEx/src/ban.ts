import { config, LocalBlackListItem, localList, saveLocalList } from './config';
import { formatDate, pushNoDuplicateItem, stripIp } from './util';

export function formatLocalKickMsg(data: LocalBlackListItem): string {
  const { reason, endTime } = data;
  return config.kickByLocalMsg
    .replace(/%REASON%/g, reason ?? '无')
    .replace(
      /%ENDTIME%/g,
      endTime ? formatDate({ date: new Date(endTime) }) : '永久'
    );
}

export function banPlayer(
  data:
    | { player: Player }
    | { name?: string; xuid?: string; ip?: string; clientId?: string },
  options: { time?: number; reason?: string } = {}
): false | { isModify: boolean; results: LocalBlackListItem[] } {
  let name: string | undefined;
  let xuid: string | undefined;
  let ip: string | undefined;
  let clientId: string | undefined;
  if ('player' in data) {
    const { player } = data;
    ({ realName: name, xuid } = player);
    ({ ip, clientId } = player.getDevice());
    ip = stripIp(ip);
  } else {
    ({ name, xuid, ip, clientId } = data);
  }

  const queryParams = [name, xuid, ip, clientId].filter((v) => v);
  if (!queryParams.length) return false;

  const results: LocalBlackListItem[] = [];
  for (const it of localList.list) {
    if (
      (name && name === it.name) ||
      (xuid && xuid === it.xuid) ||
      (ip && it.ips && it.ips.includes(ip)) ||
      (clientId && it.clientIds && it.clientIds.includes(clientId))
    )
      results.push(it);
  }

  const isModify = !!results.length;
  if (!isModify) {
    const it: LocalBlackListItem = {
      ips: [],
      clientIds: [],
    };
    localList.list.push(it);
    results.push(it);
  }

  const { time, reason } = options;
  const endTime = time ? new Date(Date.now() + time).toJSON() : undefined;
  for (const it of results) {
    if (name) it.name = name;
    if (xuid) it.xuid = xuid;
    if (ip) it.ips = pushNoDuplicateItem(it.ips || [], ip);
    if (clientId)
      it.clientIds = pushNoDuplicateItem(it.clientIds || [], clientId);
    if (endTime) it.endTime = endTime;
    if (reason) it.reason = reason;
  }

  if ('player' in data) {
    data.player.kick(formatLocalKickMsg(results[0]));
  }

  saveLocalList();
  return { isModify, results };
}
