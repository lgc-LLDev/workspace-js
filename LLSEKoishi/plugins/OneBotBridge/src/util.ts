export function replaceColorChar(txt: string): string {
  return txt.replace(/§[0123456789abcdefglonmkr]/g, '');
}

export default {};
