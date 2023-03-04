import axios from 'axios';

import { config } from './config';
import { formatDate } from './util';

export interface BlackBECommonInfo {
  uuid: string;
  name: string;
  black_id: string;
  xuid: string;
  info: string;
  level: 1 | 2 | 3;
  qq: number;
  photos?: string[];
}

export interface BlackBECommonData {
  exist: boolean;
  info: BlackBECommonInfo[];
}

export interface BlackBEPrivateInfo {
  uuid: string;
  name: string;
  xuid: string;
  info: string;
  server: string;
  time: string;
  level: 1 | 2 | 3;
  qq: number;
  area_code: string;
  phone: number;
}

export interface BlackBEPrivateData {
  repo_success: boolean;
  repo_uuid: string;
  exist: boolean;
  info: BlackBEPrivateInfo[];
}

export interface BlackBEPrivRespInfo {
  uuid: string;
  name: string;
  type: 1 | 2;
  list_num: number;
  server: string;
  server_type: string;
}

export interface BlackBEPrivRespData {
  repositories_num: number;
  repositories_list: BlackBEPrivRespInfo[];
}

export interface BlackBEPrivPieceInfo {
  uuid: string;
  name: string;
  xuid: string;
  info: string;
  time: string;
  level: 1 | 2 | 3;
  qq: number;
  area_code: string;
  phone: number;
}

export interface BlackBEPrivPieceData {
  repositories_name: string;
  page_num: number;
  piece_num: number;
  piece_list: BlackBEPrivPieceInfo[];
}

export interface BlackBEPrivUploadParam {
  black_id: string;
  name: string;
  level: number;
  xuid?: string;
  info?: string;
  server?: string;
  time?: string;
  qq?: number;
  area_code?: string;
  phone?: number;
}

export interface BlackBEPrivUploadData {
  uuid: string;
}

export interface BlackBEReturn<T> {
  success: boolean;
  status: number;
  message: string;
  version: string;
  codename: string;
  time: number;
  data: T;
}

export type BlackBEQueryInfo = BlackBECommonInfo | BlackBEPrivateInfo;
export type BlackBEPrivInfoWithRespId = BlackBEPrivateInfo & {
  black_id: string;
};
export type BlackBEQueryInfoWithRespId =
  | BlackBECommonInfo
  | BlackBEPrivInfoWithRespId;

const defaultUploadParams = {
  xuid: '1000000000000000',
  info: '无',
  server: config.serverName,
  time: formatDate({ withTime: false }),
  qq: 1000000000,
  area_code: '+86',
  phone: 10000000000,
};

export const cachedPrivResp: BlackBEPrivRespInfo[] = [];

function getHeaders(auth = true) {
  const headers: any = {
    // 'Content-Type': 'application/json',
  };

  if (auth && config.apiToken)
    headers.Authorization = `Bearer ${config.apiToken}`;

  return headers;
}

const buildUrl = (path: string): string =>
  String(new URL(`openapi/v3/${path}`, config.apiHost));

// 请求失败 axios 会抛出错误
// export const isBlackBESuccessReturn = <T>(
//   v: BlackBEReturn<T>
// ): v is BlackBESuccessReturn<T> => v.success && 'data' in v; // && !!v.data;

function checkIsWithToken(options: { withToken?: boolean }): boolean {
  const withToken = options.withToken ?? true;
  delete options.withToken;
  return withToken;
}

export async function getPrivateRespList(): Promise<
  BlackBEReturn<BlackBEPrivRespData>
> {
  const resp: BlackBEReturn<BlackBEPrivRespData> = (
    await axios.get(buildUrl('private/repositories/list'), {
      headers: getHeaders(),
      proxy: config.proxy,
    })
  ).data;

  // if (isBlackBESuccessReturn(resp)) {
  cachedPrivResp.length = 0;
  cachedPrivResp.push(...resp.data.repositories_list);
  // }

  return resp;
}

export async function getPrivatePieceList(options: {
  uuid: string;
  page?: number;
  page_size?: number;
}): Promise<BlackBEReturn<BlackBEPrivPieceData>> {
  return (
    await axios.get(buildUrl('private/repositories/piece/list'), {
      params: options,
      headers: getHeaders(),
      proxy: config.proxy,
    })
  ).data;
}

export async function uploadPrivatePiece(
  options: BlackBEPrivUploadParam
): Promise<BlackBEReturn<BlackBEPrivUploadData>> {
  return (
    await axios.post(
      buildUrl('private/repositories/piece/upload'),
      { ...defaultUploadParams, options },
      {
        headers: getHeaders(),
        proxy: config.proxy,
      }
    )
  ).data;
}

export async function deletePrivatePiece(options: {
  piece_uuid: string;
}): Promise<BlackBEReturn<[]>> {
  return (
    await axios.post(buildUrl('private/repositories/piece/delete'), options, {
      headers: getHeaders(),
      proxy: config.proxy,
    })
  ).data;
}

export async function check(options: {
  name?: string;
  qq?: string;
  xuid?: string;
  withToken?: boolean;
}): Promise<BlackBEReturn<BlackBECommonData>> {
  const withToken = checkIsWithToken(options);
  return (
    await axios.get(buildUrl('check'), {
      params: options,
      headers: getHeaders(withToken),
      proxy: config.proxy,
    })
  ).data;
}

export async function checkPrivate(options: {
  name?: string;
  qq?: string;
  xuid?: string;
}): Promise<BlackBEReturn<BlackBEPrivateData[]>> {
  if (!cachedPrivResp.length) await getPrivateRespList();

  return (
    await axios.post(
      buildUrl('check/private'),
      {
        repositories_uuid: cachedPrivResp.map((v) => v.uuid),
      },
      {
        params: options,
        headers: getHeaders(),
        proxy: config.proxy,
      }
    )
  ).data;
}

export async function getRepoByUuid(
  uuid: string
): Promise<BlackBEPrivRespInfo | null> {
  if (uuid === '1')
    return {
      uuid,
      name: '公有库',
      type: 1,
      list_num: 0,
      server: '',
      server_type: '',
    };

  if (!cachedPrivResp.length) await getPrivateRespList();
  for (const resp of cachedPrivResp) if (resp.uuid === uuid) return resp;

  return null;
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

export function clearCache() {
  cachedPrivResp.length = 0;
}

setInterval(() => clearCache(), config.clearCacheInterval);
