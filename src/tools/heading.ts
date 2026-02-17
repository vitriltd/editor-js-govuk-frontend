import { GovukBlockTool } from '../base/govuk-block-tool.js';
import type { GovukMenuConfig } from '../base/govuk-block-tool.js';
import { icons } from '../icons/index.js';

export const HEADING_SIZE_MAP: Record<number, string> = {
  1: 'govuk-heading-xl',
  2: 'govuk-heading-l',
  3: 'govuk-heading-m',
  4: 'govuk-heading-s',
};

export interface HeadingData {
  text: string;
  level: number;
}

export interface HeadingConfig {
  levels?: number[];
  defaultLevel?: number;
  [key: string]: unknown;
}

export class GovukHeading extends GovukBlockTool<HeadingData, HeadingConfig> {
  private headingEl!: HTMLElement;

  static get toolbox() {
    return { title: 'Heading', icon: icons.heading };
  }

  static get conversionConfig() {
    return {
      export: (data: HeadingData) => data.text,
      import: (text: string) => ({ text, level: 2 }),
    };
  }

  static get sanitize() {
    return { text: { br: true } };
  }

  get defaultData(): HeadingData {
    return {
      text: '',
      level: this.config.defaultLevel ?? 2,
    };
  }

  private get levels(): number[] {
    return this.config.levels ?? [1, 2, 3, 4];
  }

  private get sizeClass(): string {
    return HEADING_SIZE_MAP[this.data.level] ?? 'govuk-heading-l';
  }

  renderEdit(): HTMLElement {
    const tag = `h${this.data.level}` as keyof HTMLElementTagNameMap;
    this.headingEl = document.createElement(tag);
    this.headingEl.className = this.sizeClass;
    this.headingEl.innerHTML = this.data.text;

    this.makeEditable(this.headingEl, { placeholder: 'Heading' });

    return this.headingEl;
  }

  extractData(): HeadingData {
    return {
      text: this.getEditableHtml(this.headingEl),
      level: this.data.level,
    };
  }

  renderSettings(): GovukMenuConfig {
    return this.levels.map((level) => ({
      icon: icons.heading,
      label: `Heading ${level}`,
      isActive: this.data.level === level,
      closeOnActivate: true,
      onActivate: () => {
        this.data = { ...this.extractData(), level };
        this.rerender();
      },
    }));
  }

}
