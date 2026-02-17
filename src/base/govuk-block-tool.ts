/**
 * Abstract base class for all GOV.UK Frontend Editor.js block tools.
 *
 * Provides shared infrastructure for content-editable GOV.UK components.
 */

import type { API, BlockAPI, BlockToolConstructorOptions, ToolboxConfig } from '@editorjs/editorjs';

let bodyClassAdded = false;

export interface GovukBlockToolConfig {
  [key: string]: unknown;
}

/**
 * Menu configuration item for Editor.js block settings.
 * Defined locally to avoid deep import from @editorjs/editorjs internals.
 */
export interface GovukMenuConfigItem {
  icon?: string;
  label: string;
  isActive?: boolean;
  closeOnActivate?: boolean;
  onActivate?: () => void;
}

export type GovukMenuConfig = GovukMenuConfigItem | GovukMenuConfigItem[];

export abstract class GovukBlockTool<
  TData = Record<string, unknown>,
  TConfig extends GovukBlockToolConfig = GovukBlockToolConfig,
> {
  protected data: TData;
  protected api: API;
  protected block: BlockAPI;
  protected readOnly: boolean;
  protected config: TConfig;
  protected wrapper!: HTMLElement;

  static get isReadOnlySupported(): boolean {
    return true;
  }

  static get toolbox(): ToolboxConfig {
    return { title: 'Block', icon: '' };
  }

  constructor({ data, api, block, config, readOnly }: BlockToolConstructorOptions) {
    this.api = api;
    this.block = block;
    this.readOnly = readOnly;
    this.config = (config ?? {}) as TConfig;
    // Subclass defaultData is accessible here because it's a getter, not a field
    this.data = (data && Object.keys(data).length ? data : this.defaultData) as TData;

    if (!bodyClassAdded) {
      document.body.classList.add('govuk-frontend-supported');
      bodyClassAdded = true;
    }
  }

  /** Default data for a new block. Override in subclass. */
  get defaultData(): TData {
    return {} as TData;
  }

  /** Create the editable DOM for this block */
  abstract renderEdit(): HTMLElement;

  /** Extract current data from the DOM */
  abstract extractData(): TData;

  /** Editor.js render method */
  render(): HTMLElement {
    this.wrapper = document.createElement('div');
    this.wrapper.classList.add('govuk-editor-block');
    const content = this.renderEdit();
    this.wrapper.appendChild(content);
    return this.wrapper;
  }

  /** Editor.js save method */
  save(): TData {
    return this.extractData();
  }

  /** Editor.js validate method */
  validate(data: TData): boolean {
    return data !== undefined && data !== null;
  }

  /**
   * Make an element content-editable (unless in read-only mode).
   * Sets up placeholder text support.
   */
  protected makeEditable(
    el: HTMLElement,
    opts?: { placeholder?: string; multiline?: boolean }
  ): void {
    if (this.readOnly) return;

    el.contentEditable = 'true';

    if (opts?.placeholder) {
      el.dataset.placeholder = opts.placeholder;
      if (!el.textContent?.trim()) {
        el.classList.add('govuk-editor-block--empty');
      }
      el.addEventListener('input', () => {
        el.classList.toggle(
          'govuk-editor-block--empty',
          !el.textContent?.trim()
        );
      });
    }
  }

  /**
   * Get the inner HTML of a content-editable element, cleaned of editing artifacts.
   */
  protected getEditableHtml(el: HTMLElement): string {
    return el.innerHTML.trim();
  }

  /**
   * Get the text content of a content-editable element.
   */
  protected getEditableText(el: HTMLElement): string {
    return el.textContent?.trim() ?? '';
  }

  /**
   * Create a button for adding items (rows, sections, etc.)
   */
  protected createAddButton(label: string, onClick: () => void): HTMLElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'govuk-editor-add-button';
    btn.textContent = `+ ${label}`;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  /**
   * Re-render the block by replacing wrapper contents with fresh renderEdit() output.
   */
  protected rerender(): void {
    const newContent = this.renderEdit();
    this.wrapper.innerHTML = '';
    this.wrapper.appendChild(newContent);
  }

  /**
   * Create a remove button for items.
   */
  protected createRemoveButton(onClick: () => void): HTMLElement {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'govuk-editor-remove-button';
    btn.innerHTML = '&times;';
    btn.title = 'Remove';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    });
    return btn;
  }
}
