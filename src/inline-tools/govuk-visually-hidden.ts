/**
 * Inline tool that wraps selected text in a visually hidden span
 * (<span class="govuk-visually-hidden">).
 */

import { icons } from '../icons/index.js';

export class GovukVisuallyHidden {
  private button!: HTMLButtonElement;
  private _state = false;
  private api: any;

  static get isInline() {
    return true;
  }

  static get sanitize() {
    return {
      span: { class: true },
    };
  }

  static get title() {
    return 'Visually hidden';
  }

  constructor({ api }: { api: any }) {
    this.api = api;
  }

  render(): HTMLButtonElement {
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.classList.add(this.api.styles.inlineToolButton);
    this.button.innerHTML = icons.visuallyHidden;
    return this.button;
  }

  surround(range: Range): void {
    if (this._state) {
      this.unwrap(range);
    } else {
      this.wrap(range);
    }
  }

  private wrap(range: Range): void {
    const span = document.createElement('span');
    span.className = 'govuk-visually-hidden';
    span.appendChild(range.extractContents());
    range.insertNode(span);
    this.api.selection.expandToTag(span);
  }

  private unwrap(range: Range): void {
    const tag = this.api.selection.findParentTag('SPAN', 'govuk-visually-hidden');
    if (!tag) return;

    const text = range.extractContents();
    tag.remove();
    range.insertNode(text);
  }

  checkState(): boolean {
    const tag = this.api.selection.findParentTag('SPAN', 'govuk-visually-hidden');
    this._state = !!tag;
    this.button.classList.toggle(this.api.styles.inlineToolButtonActive, this._state);
    return this._state;
  }
}
