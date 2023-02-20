export function formatDate(
  options: {
    withTime?: boolean;
    date?: Date;
  } = {}
): string {
  const date = options.date ?? new Date();
  const withTime = options.withTime ?? false;

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
