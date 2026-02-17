import { GovukBlockTool } from '../base/govuk-block-tool.js';
import type { GovukMenuConfig } from '../base/govuk-block-tool.js';
import { icons } from '../icons/index.js';

export interface ListData {
  style: 'bullet' | 'number';
  items: string[];
}

export class GovukList extends GovukBlockTool<ListData> {
  private listEl!: HTMLElement;

  static get toolbox() {
    return { title: 'List', icon: icons.list };
  }

  static get conversionConfig() {
    return {
      export: (data: ListData) => data.items.join('\n'),
      import: (text: string) => ({
        style: 'bullet' as const,
        items: text.split('\n').filter(Boolean),
      }),
    };
  }

  static get sanitize() {
    return { items: { br: true } };
  }

  get defaultData(): ListData {
    return { style: 'bullet', items: [''] };
  }

  renderEdit(): HTMLElement {
    const tag = this.data.style === 'number' ? 'ol' : 'ul';
    this.listEl = document.createElement(tag);
    this.listEl.className = `govuk-list govuk-list--${this.data.style}`;

    for (const item of this.data.items) {
      this.addListItem(item);
    }

    if (!this.readOnly) {
      this.listEl.addEventListener('keydown', this.handleKeyDown.bind(this));
    }

    return this.listEl;
  }

  private addListItem(text: string, before?: HTMLElement): HTMLElement {
    const li = document.createElement('li');
    li.innerHTML = text;
    this.makeEditable(li, { placeholder: 'List item...' });

    if (before) {
      this.listEl.insertBefore(li, before);
    } else {
      this.listEl.appendChild(li);
    }
    return li;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    const target = e.target as HTMLElement;
    if (target.tagName !== 'LI') return;

    if (e.key === 'Enter') {
      e.preventDefault();
      const newLi = this.addListItem('', target.nextElementSibling as HTMLElement);
      newLi.focus();
    }

    if (e.key === 'Backspace' && !target.textContent?.trim() && this.listEl.children.length > 1) {
      e.preventDefault();
      const prev = target.previousElementSibling as HTMLElement;
      target.remove();
      if (prev) {
        prev.focus();
        // Move caret to end
        const range = document.createRange();
        const sel = window.getSelection();
        range.selectNodeContents(prev);
        range.collapse(false);
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
  }

  extractData(): ListData {
    const items: string[] = [];
    for (const li of Array.from(this.listEl.children) as HTMLElement[]) {
      items.push(this.getEditableHtml(li));
    }
    return {
      style: this.data.style,
      items: items.length ? items : [''],
    };
  }

  renderSettings(): GovukMenuConfig {
    return [
      {
        icon: icons.list,
        label: 'Bullet list',
        isActive: this.data.style === 'bullet',
        closeOnActivate: true,
        onActivate: () => {
          this.data = { ...this.extractData(), style: 'bullet' };
          this.rerender();
        },
      },
      {
        icon: icons.list,
        label: 'Numbered list',
        isActive: this.data.style === 'number',
        closeOnActivate: true,
        onActivate: () => {
          this.data = { ...this.extractData(), style: 'number' };
          this.rerender();
        },
      },
    ];
  }

}
