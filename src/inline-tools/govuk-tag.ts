/**
 * Inline tool that wraps selected text in a GOV.UK Tag (<strong class="govuk-tag">).
 */

import { icons } from '../icons/index.js';
import { TAG_COLOURS } from '../tools/tag.js';

export class GovukTagInline {
  private button!: HTMLButtonElement;
  private actionsEl!: HTMLDivElement;
  private _state = false;
  private api: any;

  static get isInline() {
    return true;
  }

  static get sanitize() {
    return {
      strong: { class: true },
    };
  }

  static get title() {
    return 'GOV.UK Tag';
  }

  constructor({ api }: { api: any }) {
    this.api = api;
  }

  render(): HTMLButtonElement {
    this.button = document.createElement('button');
    this.button.type = 'button';
    this.button.classList.add(this.api.styles.inlineToolButton);
    this.button.innerHTML = icons.tagInline;
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
    const strong = document.createElement('strong');
    strong.className = 'govuk-tag';
    strong.appendChild(range.extractContents());
    range.insertNode(strong);
    this.api.selection.expandToTag(strong);
  }

  private unwrap(range: Range): void {
    const tag = this.api.selection.findParentTag('STRONG', 'govuk-tag');
    if (!tag) return;

    const text = range.extractContents();
    tag.remove();
    range.insertNode(text);
  }

  checkState(selection: Selection): boolean {
    const tag = this.api.selection.findParentTag('STRONG', 'govuk-tag');
    this._state = !!tag;
    this.button.classList.toggle(this.api.styles.inlineToolButtonActive, this._state);

    if (this.actionsEl) {
      this.actionsEl.hidden = !this._state;
    }

    return this._state;
  }

  renderActions(): HTMLDivElement {
    this.actionsEl = document.createElement('div');
    this.actionsEl.classList.add('govuk-tag-inline-actions');
    this.actionsEl.hidden = true;

    for (const colour of TAG_COLOURS) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `govuk-tag-inline-actions__btn govuk-tag${colour.classes ? ' ' + colour.classes : ''}`;
      btn.textContent = colour.label;
      btn.dataset.classes = colour.classes;
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        this.applyColour(colour.classes);
      });
      this.actionsEl.appendChild(btn);
    }

    return this.actionsEl;
  }

  private applyColour(colourClass: string): void {
    const tag = this.api.selection.findParentTag('STRONG', 'govuk-tag');
    if (!tag) return;

    // Remove all existing tag colour classes
    const classesToRemove = TAG_COLOURS
      .map((c) => c.classes)
      .filter(Boolean);
    tag.classList.remove(...classesToRemove);

    // Apply new colour
    if (colourClass) {
      tag.classList.add(colourClass);
    }

    this.updateActionsVisibility();
  }

  private updateActionsVisibility(): void {
    this.actionsEl.hidden = !this._state;
  }

  /**
   * Called by Editor.js after checkState — show/hide the actions panel.
   */
  clear(): void {
    this.actionsEl.hidden = true;
  }
}
