// LiteLoaderScript Dev Helper
/// <reference path="d:\Coding\bds\LLSEAids/dts/llaids/src/index.d.ts"/>

export class CustomFormEx<T = Record<string, never>> {
  #title = '';

  #form = mc.newCustomForm();

  #objectIds: (keyof T | null)[] = [];

  constructor(title = '') {
    this.title = title;
  }

  set title(val: string) {
    this.#title = val;
    this.#form.setTitle(val);
  }

  get title() {
    return this.#title;
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
    options: { step?: number; default?: string } = {}
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

  private parseReturn(data: (string | boolean | number)[]): T;

  private parseReturn(data: null): null;

  private parseReturn(data: (string | boolean | number)[] | null): T | null {
    if (!data) return data;

    const res: any = {};
    for (let i = 0; i < data.length; i += 1) {
      const k = this.#objectIds[i];
      const v = data[i];
      if (k) res[k] = v;
    }
    return res;
  }

  sendAsync(player: Player): Promise<T | null> {
    return new Promise((resolve) => {
      player.sendForm(this.#form, (_, data) => {
        setTimeout(() => {
          resolve(this.parseReturn(data));
        }, 0);
      });
    });
  }
}
