import { Render, Session } from 'koishi';

export interface CustomRegex {
  from: { type: string; regex: string; superuser?: boolean }[];
  actions: { type: string; content: string }[];
}

export interface Config {
  superusers: number[];
  enableGroups: number[];
  cmdPrefix: string;
  cmdStatus: string;
  pokeStatus: boolean;
  allowCmd: string[];
  playerChatTemplate?: string;
  groupChatTemplate?: string;
  playerPreJoinTemplate?: string;
  playerJoinTemplate?: string;
  playerLeftTemplate?: string;
  playerDieTemplate?: string;
  serverStatTemplate?: string;
  specialAttrPrefix?: string;
  specialAttrSuffix?: string;
  customRegex?: CustomRegex[];
}

export type AsyncFunction<A extends Array<unknown>, O> = (
  ...args: A
) => Promise<O>;

export type TransRule = string | Render<string | Promise<string>, Session>;
