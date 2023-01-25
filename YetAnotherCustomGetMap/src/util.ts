import { existsSync, mkdirSync, rmSync } from 'fs';

import { tmpPath } from './const';

import type { MessageElem, TextElem } from 'oicq';

/**
 * 把错误甩出去
 * @param e 错误内容
 */
export function throwToMain(e: unknown) {
  setTimeout(() => {
    throw e;
  }, 0);
}

/**
 * 格式化错误堆栈
 * @param e 错误对象
 * @returns 格式化后的错误
 */
export function formatError(e: unknown): string {
  let msg = e;
  if (e instanceof Error) msg = e.stack || e.message;
  return String(msg);
}

/**
 * 输出错误到控制台
 * @param e 错误
 */
export function logError(e: unknown) {
  logger.error(`插件出错！\n${formatError(e)}`);
}

/**
 * 延时
 * @param time 时长，单位 ms
 */
export function sleep(time: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

/**
 * wrapper，给async function套一层sync function，当async function运行出错时会打印错误
 * @param func async function
 * @returns wrapped sync function
 */
export function callAsyncLogErr<T extends Array<unknown>>(
  func: (...args: T) => Promise<unknown>
): (...args: T) => void {
  return (...args: T) => {
    setTimeout(() => func(...args).catch(logError), 0);
  };
}

/**
 * 清理临时文件目录
 */
export function deleteTmpDirSync() {
  logger.info('清除临时文件目录……');
  try {
    if (existsSync(tmpPath)) rmSync(tmpPath, { recursive: true, force: true });
    mkdirSync(tmpPath);
    logger.info('清除临时文件目录完毕！');
  } catch (e) {
    logger.error(`清除临时文件目录失败！\n${formatError(e)}`);
  }
}

/** 工具 空函数 */
export const emptyCallback = () => {};

export function extractMsgPlaintext(msg: MessageElem[]): string {
  return (msg.filter((v) => v.type === 'text') as TextElem[])
    .map((v) => v.text)
    .join('');
}
