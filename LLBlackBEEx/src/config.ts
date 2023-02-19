import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

import { dataPath } from './const';

import type { AxiosProxyConfig } from 'axios';

const configPath = join(dataPath, 'config.json');

interface Config {
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
};

export function saveConfig() {
  writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export function reloadConfig() {
  if (!existsSync(configPath)) saveConfig();
  else
    Object.entries(
      JSON.parse(readFileSync(configPath, { encoding: 'utf-8' })) as Config
    ).forEach((x) => {
      const [k, v] = x;
      Object.defineProperty(config, k, { value: v });
    });

  if (typeof config.proxy === 'string') {
    const { hostname, port, protocol, username, password } = new URL(
      config.proxy
    );
    config.proxy = {
      host: hostname,
      port: Number(port),
      protocol,
      auth: { username, password },
    };
  }
}

reloadConfig();
