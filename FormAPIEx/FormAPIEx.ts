// LiteLoaderScript Dev Helper
/// <reference path="d:\Coding\bds\LLSEAids/dts/llaids/src/index.d.ts"/>

export const NAME = 'FormAPIEx';
export const VERSION = [0, 2, 1] as const;
export const AUTHOR = 'student_2333 <lgc2333@126.com>';
export const LICENSE = 'Apache-2.0';

export function sendModalFormAsync(
  player: Player,
  title: string,
  content: string,
  confirmButton = '§a确认',
  cancelButton = '§c取消'
): Promise<boolean | null | undefined> {
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
    // @ts-expect-error 这里的错误是误报
    player.sendForm(form, (_, data) => setTimeout(() => resolve(data), 0));
  });
}

export interface CustomFormLabelObject {
  type: 'label';
  text: string;
}

export interface CustomFormInputObject {
  type: 'input';
  title: string;
  placeholder?: string;
  defaultVal?: string;
}

export interface CustomFormSwitchObject {
  type: 'switch';
  title: string;
  defaultVal?: boolean;
}

export interface CustomFormDropdownObject {
  type: 'dropdown';
  title: string;
  items: string[];
  defaultVal?: number;
}

export interface CustomFormSliderObject {
  type: 'slider';
  title: string;
  min: number;
  max: number;
  step?: number;
  defaultVal?: number;
}

export interface CustomFormStepSliderObject {
  type: 'stepSlider';
  title: string;
  items: string[];
  defaultVal?: number;
}

export type CustomFormObject =
  | CustomFormLabelObject
  | CustomFormInputObject
  | CustomFormSwitchObject
  | CustomFormDropdownObject
  | CustomFormSliderObject
  | CustomFormStepSliderObject;

export function buildCustomForm(
  formTitle: string,
  objects: CustomFormObject[]
): CustomForm {
  const form = mc.newCustomForm();
  form.setTitle(formTitle);

  for (const obj of objects) {
    switch (obj.type) {
      case 'label': {
        form.addLabel(obj.text);
        break;
      }
      case 'input': {
        const { title, placeholder, defaultVal } = obj;
        form.addInput(title, placeholder ?? '', defaultVal ?? '');
        break;
      }
      case 'switch': {
        const { title, defaultVal } = obj;
        form.addSwitch(title, defaultVal ?? false);
        break;
      }
      case 'dropdown': {
        const { title, items, defaultVal } = obj;
        form.addDropdown(title, items, defaultVal ?? 0);
        break;
      }
      case 'slider': {
        const { title, min, max, step, defaultVal } = obj;
        form.addSlider(title, min, max, step ?? 1, defaultVal ?? min);
        break;
      }
      case 'stepSlider': {
        const { title, items, defaultVal } = obj;
        form.addStepSlider(title, items, defaultVal ?? 0);
        break;
      }
      // no default
    }
  }

  return form;
}

export type CustomFormObjectReturnType<T extends CustomFormObject> =
  T extends CustomFormInputObject
    ? string
    : T extends CustomFormSwitchObject
    ? boolean
    : T extends
        | CustomFormDropdownObject
        | CustomFormSliderObject
        | CustomFormStepSliderObject
    ? number
    : undefined;

export type CustomFormReturn<T extends { [id: string]: CustomFormObject }> = {
  [k in keyof T]: CustomFormObjectReturnType<T[k]>;
};

export class CustomFormEx<T extends { [id: string]: CustomFormObject } = {}> {
  public title = '';

  #objects: [string | undefined, CustomFormObject][] = [];

  constructor(title = '') {
    this.title = title;
  }

  get objects() {
    return this.#objects;
  }

  setTitle(val: string) {
    this.title = val;
    return this;
  }

  // add object

  // 格式化之后着色有问题
  // prettier-ignore
  push<TObj extends CustomFormObject, TId extends TObj extends CustomFormLabelObject ? string | undefined : string>(
    id: TId,
    obj: TObj
  ): CustomFormEx<
    T &
      (TId extends string
        ? { [k in TId]: TObj }
        : {})
  > {
    this.#objects.push([id, obj]);
    return this as any;
  }

  // prettier-ignore
  unshift<TObj extends CustomFormObject, TId extends TObj extends CustomFormLabelObject ? string | undefined : string>(
    id: TId,
    obj: TObj
  ): CustomFormEx<
    T & (TId extends string ? { [k in TId]: TObj } : {})
  > {
    this.#objects.unshift([id, obj]);
    return this as any;
  }

  // prettier-ignore
  insert<TObj extends CustomFormObject, TId extends TObj extends CustomFormLabelObject ? string | undefined : string>(
    index: number,
    id: TId,
    obj: TObj
  ): CustomFormEx<
    T & (TId extends string ? { [k in TId]: TObj } : {})
  > {
    this.#objects.splice(index, 0, [id, obj]);
    return this as any;
  }

  // remove object

  remove<TId extends keyof T>(id: TId): CustomFormEx<Omit<T, TId>> {
    for (let i = 0; i < this.#objects.length; i += 1) {
      const [objId] = this.#objects[i];
      if (objId === id) {
        this.#objects.splice(i, 1);
        break;
      }
    }
    return this as any;
  }

  // get object by id

  get<TId extends keyof T>(id: TId): T[TId] | null {
    for (const [objId, val] of this.#objects) {
      if (objId === id) return val as any;
    }
    return null;
  }

  // manually add object methods

  addLabel(text: string): CustomFormEx<T>;

  addLabel<TId extends string>(
    id: TId,
    text: string
  ): CustomFormEx<T & { [k in TId]: CustomFormLabelObject }>;

  addLabel(arg1: string, arg2?: string) {
    const id = arg2 ? arg1 : undefined;
    const text = arg2 ?? arg1;
    return this.push(id, { type: 'label', text });
  }

  addInput<TId extends string>(
    id: TId,
    title: string,
    options: { placeholder?: string; default?: string } = {}
  ): CustomFormEx<T & { [k in TId]: CustomFormInputObject }> {
    const { placeholder, default: defaultVal } = options;
    return this.push(id, {
      type: 'input',
      title,
      placeholder,
      defaultVal,
    });
  }

  addSwitch<TId extends string>(
    id: TId,
    title: string,
    defaultVal = false
  ): CustomFormEx<T & { [k in TId]: CustomFormSwitchObject }> {
    return this.push(id, { type: 'switch', title, defaultVal });
  }

  addDropdown<TId extends string>(
    id: TId,
    title: string,
    items: string[],
    defaultVal = 0
  ): CustomFormEx<T & { [k in TId]: CustomFormDropdownObject }> {
    return this.push(id, { type: 'dropdown', title, items, defaultVal });
  }

  addSlider<TId extends string>(
    id: TId,
    title: string,
    min: number,
    max: number,
    options: { step?: number; default?: number } = {}
  ): CustomFormEx<T & { [k in TId]: CustomFormSliderObject }> {
    const { step, default: defaultVal } = options;
    return this.push(id, { type: 'slider', title, min, max, step, defaultVal });
  }

  addStepSlider<TId extends string>(
    id: TId,
    title: string,
    items: string[],
    defaultVal = 0
  ): CustomFormEx<T & { [k in TId]: CustomFormStepSliderObject }> {
    return this.push(id, { type: 'stepSlider', title, items, defaultVal });
  }

  // send

  private parseReturn(
    data: (string | boolean | number | null | undefined)[]
  ): CustomFormReturn<T> {
    const res: any = {};
    for (let i = 0; i < data.length; i += 1) {
      const [id] = this.#objects[i];
      const val = data[i] ?? undefined;
      if (id) res[id] = val;
    }
    return res;
  }

  async sendAsync(player: Player): Promise<CustomFormReturn<T> | null> {
    const data = await sendFormAsync(
      player,
      buildCustomForm(
        this.title,
        this.objects.map((v) => v[1])
      )
    );
    if (data === null || data === undefined) return null;
    return this.parseReturn(data);
  }
}

export class SimpleFormAsync {
  public title = '';

  public content = '';

  /** [ text, image ] */
  public buttons: [string, string?][] = [];

  constructor(
    options: {
      title?: string;
      content?: string;
      buttons?: [string, string?][];
    } = {}
  ) {
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
    const formatted = this.formatButtons(buttons).map((v) => v[0]);
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
