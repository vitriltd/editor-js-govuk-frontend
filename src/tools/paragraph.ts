import { GovukBlockTool } from '../base/govuk-block-tool.js';
import type { GovukMenuConfig } from '../base/govuk-block-tool.js';
import { icons } from '../icons/index.js';

export interface ParagraphData {
  text: string;
  size: 'body-l' | 'body' | 'body-s';
}

export class GovukParagraph extends GovukBlockTool<ParagraphData> {
  private paragraphEl!: HTMLElement;

  static get toolbox() {
    return { title: 'Paragraph', icon: icons.paragraph };
  }

  static get conversionConfig() {
    return {
      export: (data: ParagraphData) => data.text,
      import: (text: string) => ({ text, size: 'body' as const }),
    };
  }

  static get sanitize() {
    return { text: { br: true, a: { href: true }, b: true, i: true, strong: true, em: true } };
  }

  get defaultData(): ParagraphData {
    return { text: '', size: 'body' };
  }

  private get sizeClass(): string {
    return `govuk-${this.data.size}`;
  }

  renderEdit(): HTMLElement {
    this.paragraphEl = document.createElement('p');
    this.paragraphEl.className = this.sizeClass;
    this.paragraphEl.innerHTML = this.data.text;

    this.makeEditable(this.paragraphEl, { placeholder: 'Start typing...' });

    return this.paragraphEl;
  }

  extractData(): ParagraphData {
    return {
      text: this.getEditableHtml(this.paragraphEl),
      size: this.data.size,
    };
  }

  renderSettings(): GovukMenuConfig {
    const sizes: { label: string; size: ParagraphData['size'] }[] = [
      { label: 'Large', size: 'body-l' },
      { label: 'Normal', size: 'body' },
      { label: 'Small', size: 'body-s' },
    ];

    return sizes.map(({ label, size }) => ({
      icon: icons.paragraph,
      label,
      isActive: this.data.size === size,
      closeOnActivate: true,
      onActivate: () => {
        this.data = { ...this.extractData(), size };
        this.rerender();
      },
    }));
  }

}
