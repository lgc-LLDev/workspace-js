import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

import { dataPath } from './const';

import type { AxiosProxyConfig } from 'axios';

const configPath = join(dataPath, 'config.json');
const localListPath = join(dataPath, 'local_list.json');

export interface Config {
  apiToken: string;
  banIp: boolean;
  banDevice: boolean;
  hidePassMessage: boolean;
  disableBlackBE: boolean;
  kickByLocalMsg: boolean;
  kickByCloudMsg: boolean;
  serverName: string;
  proxy: AxiosProxyConfig | false;
  apiHost: string;
  clearCacheInterval: number;
  registerBanCommand: boolean;
}

export interface LocalBlackListItem {
  name: string;
  xuid: string;
  ips: string[];
  clientIds: string[];
  /**  Date.toJson() */ endTime: string;
  reason: string;
  /** @deprecated */ ip?: string;
}

export interface LocalBlackList {
  list: LocalBlackListItem[];
}

export const config: Config = {
  apiToken: '',
  banIp: true,
  banDevice: true,
  hidePassMessage: true,
  disableBlackBE: true,
  kickByCloudMsg: true,
  kickByLocalMsg: true,
  serverName: '服务器',
  proxy: false,
  apiHost: 'https://api.blackbe.work/',
  clearCacheInterval: 3600000,
  registerBanCommand: true,
};

export const localList: LocalBlackList = { list: [] };

export function saveConfig() {
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export function saveLocalList() {
  writeFileSync(localListPath, JSON.stringify(localList, null, 2));
}

export function reloadConfig() {
  function loadConfig<T>(path: string, overrideConfig: T): T {
    Object.entries(
      JSON.parse(readFileSync(path, { encoding: 'utf-8' }))
    ).forEach(([k, v]) => {
      Object.defineProperty(overrideConfig, k, { value: v });
    });
    return overrideConfig;
  }

  if (!existsSync(configPath)) saveConfig();
  if (!existsSync(localListPath)) saveLocalList();

  loadConfig(configPath, config);
  loadConfig(localListPath, localList);

  if (typeof config.proxy === 'string') {
    const { hostname, port, protocol, username, password } = new URL(
      config.proxy
    );
    config.proxy = {
      host: hostname,
      port: Number(port),
      protocol: protocol.replace(':', ''),
      auth: { username, password },
    };
    saveConfig();
  }

  let localListChanged = false;
  for (const bl of localList.list) {
    if (bl.ip) {
      bl.ips = [bl.ip];
      bl.clientIds = [];
      delete bl.ip;
      localListChanged = true;
    }
  }
  if (localListChanged) saveLocalList();
}

reloadConfig();
