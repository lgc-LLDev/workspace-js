// LiteLoaderScript Dev Helper
/// <reference path="d:\Coding\bds\LLSEAids/dts/llaids/src/index.d.ts"/>

export const VERSION = [0, 1, 0];

export function sendModalFormAsync(
  player: Player,
  title: string,
  content: string,
  confirmButton = '§a确认',
  cancelButton = '§c取消'
): Promise<boolean> {
  return new Promise((resolve) => {
    player.sendModalForm(
      title,
      content,
      confirmButton,
      cancelButton,
      (_, data) => setTimeout(() => resolve(data), 0)
    );
  });
}

export function sendFormAsync(
  player: Player,
  form: SimpleForm
): Promise<number | null | undefined>;
export function sendFormAsync(
  player: Player,
  form: CustomForm
): Promise<(string | boolean | number)[] | null | undefined>;
export function sendFormAsync(
  player: Player,
  form: SimpleForm | CustomForm
): Promise<number | (string | boolean | number)[] | null | undefined> {
  return new Promise((resolve) => {
    // @ts-expect-error 这里的错误是误报（?
    player.sendForm(form, (_, data) => setTimeout(() => resolve(data), 0));
  });
}

export class CustomFormEx<T = Record<string, never>> {
  public title = '';

  #form = mc.newCustomForm();

  #objectIds: (keyof T | null)[] = [];

  constructor(title = '') {
    this.title = title;
  }

  setTitle(val: string) {
    this.title = val;
    return this;
  }

  addLabel(text: string) {
    this.#form.addLabel(text);
    this.#objectIds.push(null);
    return this;
  }

  addInput<TId extends string>(
    id: TId,
    title: string,
    options: { placeholder?: string; default?: string } = {}
  ): CustomFormEx<T & { [k in TId]: string }> {
    const placeholder = options.placeholder ?? '';
    const defaultVal = options.default ?? '';
    this.#form.addInput(title, placeholder, defaultVal);
    this.#objectIds.push(id as unknown as keyof T);
    return this as CustomFormEx<T & { [k in TId]: string }>;
  }

  addSwitch<TId extends string>(
    id: TId,
    title: string,
    defaultVal = false
  ): CustomFormEx<T & { [k in TId]: boolean }> {
    this.#form.addSwitch(title, defaultVal);
    this.#objectIds.push(id as unknown as keyof T);
    return this as CustomFormEx<T & { [k in TId]: boolean }>;
  }

  addDropdown<TId extends string>(
    id: TId,
    title: string,
    items: string[],
    defaultVal = 0
  ): CustomFormEx<T & { [k in TId]: number }> {
    this.#form.addDropdown(title, items, defaultVal);
    this.#objectIds.push(id as unknown as keyof T);
    return this as CustomFormEx<T & { [k in TId]: number }>;
  }

  addSlider<TId extends string>(
    id: TId,
    title: string,
    min: number,
    max: number,
    options: { step?: number; default?: number } = {}
  ): CustomFormEx<T & { [k in TId]: number }> {
    const step = options.step ?? 1;
    const defaultVal = options.default ?? min;
    this.#form.addSlider(title, min, max, step, defaultVal);
    this.#objectIds.push(id as unknown as keyof T);
    return this as CustomFormEx<T & { [k in TId]: number }>;
  }

  addStepSlider<TId extends string>(
    id: TId,
    title: string,
    items: string[],
    defaultVal = 0
  ): CustomFormEx<T & { [k in TId]: number }> {
    this.#form.addStepSlider(title, items, defaultVal);
    this.#objectIds.push(id as unknown as keyof T);
    return this as CustomFormEx<T & { [k in TId]: number }>;
  }

  private parseReturn(data: (string | boolean | number)[]): T {
    const res: any = {};
    for (let i = 0; i < data.length; i += 1) {
      const k = this.#objectIds[i];
      const v = data[i];
      if (k) res[k] = v;
    }
    return res;
  }

  async sendAsync(player: Player): Promise<T | null> {
    this.#form.setTitle(this.title);
    const data = await sendFormAsync(player, this.#form);
    if (data === null || data === undefined) return null;
    return this.parseReturn(data);
  }
}

export class SimpleFormAsync {
  public title = '';

  public content = '';

  /** [ text, image ] */
  public buttons: [string, string?][] = [];

  constructor(options: {
    title?: string;
    content?: string;
    buttons?: [string, string?][];
  }) {
    const { title, content, buttons } = options;
    if (title) this.title = title;
    if (content) this.content = content;
    if (buttons) this.buttons = buttons;
  }

  setTitle(val: string) {
    this.title = val;
    return this;
  }

  setContent(val: string) {
    this.content = val;
    return this;
  }

  addButton(text: string, image?: string) {
    this.buttons.push([text, image]);
    return this;
  }

  sendAsync(player: Player): Promise<number | null | undefined> {
    const form = mc
      .newSimpleForm()
      .setTitle(this.title)
      .setContent(this.content);
    this.buttons.forEach(([text, image]) => {
      if (image) form.addButton(text, image);
      else form.addButton(text);
    });
    return sendFormAsync(player, form);
  }
}

export class SimpleFormEx<T> {
  public title = '';

  /**
   * {{currentPage}} - 当前页数
   * {{maxPage}} - 最大页数
   * {{count}} - 条目总数
   */
  public content =
    '§a第 §e{{currentPage}} §f/ §6{{maxPage}} §a页 §7| §a共 §e{{count}} §a条';

  public buttons: T[] = [];

  /** @returns [ text, image ] */
  // eslint-disable-next-line class-methods-use-this
  public formatter: (v: T, index: number, array: T[]) => [string, string?] = (
    v
  ) => [`§3${String(v)}`];

  public canTurnPage = false;

  public canJumpPage = false;

  public maxPageNum = 15;

  public hasSearchButton = false;

  // eslint-disable-next-line class-methods-use-this
  public searcher: (buttons: T[], param: string) => T[] = (
    buttons,
    param
  ): T[] => {
    const params = param.split(/\s/g);
    const formatted = buttons.map((v) => String(v));
    const result: T[] = [];
    formatted.forEach((v, i) => {
      for (const wd of params) {
        if (v.includes(wd)) result.push(buttons[i]);
      }
    });
    return result;
  };

  constructor(buttons: T[] = []) {
    this.buttons = buttons;
  }

  formatButtons(buttons: T[] = this.buttons): [string, string?][] {
    return buttons.map(this.formatter);
  }

  getMaxPageNum(): number {
    return this.canTurnPage
      ? Math.ceil(this.buttons.length / this.maxPageNum)
      : 1;
  }

  getPage(page = 1): T[] {
    if (page > this.getMaxPageNum()) return [];
    return this.buttons.slice(
      (page - 1) * this.maxPageNum,
      page * this.maxPageNum
    );
  }

  /**
   * @returns null 为没搜到, false 为取消搜索
   */
  async sendSearchForm(
    player: Player,
    defaultVal = ''
  ): Promise<T | null | false> {
    const form = new CustomFormEx(this.title);
    const res = await form
      .addInput('param', '请输入你要搜索的内容', { default: defaultVal })
      .sendAsync(player);
    if (!res) return false;

    const searched = this.searcher(this.buttons, res.param);
    if (!searched.length) {
      await new SimpleFormAsync({
        title: this.title,
        content: '§6没有搜索到结果',
      }).sendAsync(player);
      return null;
    }

    const searchForm = new SimpleFormEx<T>();
    searchForm.title = this.title;
    searchForm.content = `§a为您找到了 §l§6${searched.length} §r§a个结果\n${searchForm.content}`;
    searchForm.buttons = searched;
    searchForm.formatter = this.formatter;
    searchForm.canTurnPage = this.canTurnPage;
    searchForm.canJumpPage = this.canJumpPage;
    searchForm.maxPageNum = this.maxPageNum;
    searchForm.hasSearchButton = false;
    const selected = await searchForm.sendAsync(player);

    return selected === null ? false : selected;
  }

  async sendAsync(player: Player, page = 1): Promise<T | null> {
    const buttons = this.canTurnPage ? this.getPage(page) : this.buttons;
    const formattedButtons = this.formatButtons(buttons);

    const maxPage = this.getMaxPageNum();
    const pageAboveOne = maxPage > 1;

    const hasJumpBtn = this.canJumpPage && pageAboveOne;
    const hasPreviousPage = page > 1 && pageAboveOne;
    const hasNextPage = page < maxPage && pageAboveOne;

    if (hasPreviousPage) formattedButtons.unshift(['§2<- 上一页']);
    if (hasJumpBtn) formattedButtons.unshift(['§1跳页']);
    if (this.hasSearchButton) formattedButtons.unshift(['§1搜索']);
    if (hasNextPage) formattedButtons.push(['§2下一页 ->']);

    const formatContent = (content: string): string => {
      const count = this.buttons.length;
      const formatMap = {
        currentPage: page,
        maxPage,
        count,
      };
      for (const [key, val] of Object.entries(formatMap)) {
        content = content.replaceAll(`{{${key}}}`, String(val));
      }
      return content;
    };

    const resultIndex = await new SimpleFormAsync({
      title: this.title,
      content: formatContent(this.content),
      buttons: formattedButtons,
    }).sendAsync(player);
    if (resultIndex === null || resultIndex === undefined) return null;

    let offset = 0;
    if (this.hasSearchButton) {
      if (resultIndex === offset) {
        const res = await this.sendSearchForm(player);
        if (res === false || res === null) {
          // eslint-disable-next-line no-return-await
          return await this.sendAsync(player, page);
        }
        return res;
      }
      offset += 1;
    }

    if (hasJumpBtn) {
      if (resultIndex === offset) {
        const res = await new CustomFormEx(this.title)
          .addSlider('num', '请选择你要跳转的页数', 1, maxPage, {
            default: page,
          })
          .sendAsync(player);
        // eslint-disable-next-line no-return-await
        return await this.sendAsync(player, res ? res.num : page);
      }
      offset += 1;
    }

    if (hasPreviousPage) {
      if (resultIndex === offset) {
        // eslint-disable-next-line no-return-await
        return await this.sendAsync(player, page - 1);
      }
      offset += 1;
    }

    if (hasNextPage && resultIndex + 1 === formattedButtons.length) {
      // eslint-disable-next-line no-return-await
      return await this.sendAsync(player, page + 1);
    }

    const realIndex = resultIndex - offset;
    return buttons[realIndex];
  }
}
