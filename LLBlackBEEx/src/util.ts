export function wrapAsyncFunc<T extends Array<unknown>>(
  func: (...args: T) => Promise<unknown>
): (...args: T) => void {
  return (...args: T) => {
    setTimeout(() => func(...args).catch((e) => logger.error(String(e))), 0);
  };
}

export function formatDate(
  options: {
    withTime?: boolean;
    date?: Date;
  } = {}
): string {
  const date = options.date ?? new Date();
  const withTime = options.withTime ?? true;

  const yr = date.getFullYear();
  const mon = date.getMonth() + 1;
  const day = date.getDate();
  let formatted = `${yr}-${mon}-${day}`;

  if (withTime) {
    const padNum = (n: number): string => n.toString().padStart(2, '0');

    const hr = date.getHours();
    const min = padNum(date.getMinutes());
    const sec = padNum(date.getSeconds());
    formatted += ` ${hr}:${min}:${sec}`;
  }

  return formatted;
}

export function delFormatCode(text: string): string {
  return text.replace(/§[0-9abcdefgklmnor]/g, '');
}

export function checkValInArray<T>(
  arr: T[],
  callback: (v: T) => boolean
): boolean {
  for (const it of arr) if (callback(it)) return true;
  return false;
}

export function fuzzyValIsInArray<T extends string>(arr: T[], val: T): boolean {
  return checkValInArray(arr, (v) => v.includes(val));
}

export function stripIp(ip: string): string {
  return ip.split(':')[0];
}

export function pushNoDuplicateItem<T, TI>(
  list: (T | TI)[],
  item: TI
): (T | TI)[] {
  if (!list.includes(item)) list.push(item);
  return list;
}
