import { GovukBlockTool } from '../base/govuk-block-tool.js';
import { icons } from '../icons/index.js';

export interface TabItemData {
  label: string;
  id: string;
  panel: { html: string };
}

export interface TabsData {
  items: TabItemData[];
}

/** Convert a tab label to a URL-friendly slug, e.g. "Past day" → "past-day" */
function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    || 'tab';
}

export class GovukTabs extends GovukBlockTool<TabsData> {
  private containerEl!: HTMLElement;
  private tabListEl!: HTMLElement;
  private panelsEl!: HTMLElement;
  private activeTabIndex = 0;

  static get toolbox() {
    return { title: 'Tabs', icon: icons.tabs };
  }

  static get sanitize() {
    return {
      items: {
        panel: {
          html: {
            br: true, a: { href: true }, strong: true, em: true,
            p: { class: true }, ul: { class: true }, ol: { class: true }, li: true,
            h2: { class: true }, h3: { class: true },
            table: { class: true }, thead: { class: true }, tbody: { class: true },
            tr: { class: true }, th: { class: true, scope: true }, td: { class: true },
          },
        },
      },
    };
  }

  get defaultData(): TabsData {
    return {
      items: [
        { label: 'Tab 1', id: 'tab-1', panel: { html: '' } },
        { label: 'Tab 2', id: 'tab-2', panel: { html: '' } },
      ],
    };
  }

  renderEdit(): HTMLElement {
    this.containerEl = document.createElement('div');
    this.containerEl.className = 'govuk-tabs govuk-editor-tabs--editing';
    this.containerEl.setAttribute('data-module', 'govuk-tabs');

    const title = document.createElement('h2');
    title.className = 'govuk-tabs__title';
    title.textContent = 'Contents';

    this.tabListEl = document.createElement('ul');
    this.tabListEl.className = 'govuk-tabs__list';

    this.panelsEl = document.createElement('div');
    this.panelsEl.className = 'govuk-editor-tabs-panels';

    for (let i = 0; i < this.data.items.length; i++) {
      this.addTabElements(this.data.items[i], i);
    }

    this.containerEl.appendChild(title);
    this.containerEl.appendChild(this.tabListEl);
    this.containerEl.appendChild(this.panelsEl);

    if (!this.readOnly) {
      this.containerEl.appendChild(
        this.createAddButton('Add tab', () => this.addNewTab())
      );
    }

    this.showTab(0);

    return this.containerEl;
  }

  private addTabElements(item: TabItemData, index: number): void {
    // Tab button
    const li = document.createElement('li');
    li.className = 'govuk-tabs__list-item';

    const tabLink = document.createElement('a');
    tabLink.className = 'govuk-tabs__tab';
    tabLink.href = `#${item.id}`;
    tabLink.textContent = item.label;

    if (!this.readOnly) {
      this.makeEditable(tabLink, { placeholder: 'Tab label' });
      tabLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.showTab(index);
      });
    }

    li.appendChild(tabLink);

    if (!this.readOnly && this.data.items.length > 1) {
      const removeBtn = this.createRemoveButton(() => {
        this.removeTab(index);
      });
      removeBtn.className += ' govuk-editor-tab-remove';
      li.appendChild(removeBtn);
    }

    this.tabListEl.appendChild(li);

    // Panel
    const panel = document.createElement('div');
    panel.className = 'govuk-tabs__panel';
    panel.id = item.id;

    const panelContent = document.createElement('div');
    panelContent.className = 'govuk-editor-tab-content';
    panelContent.innerHTML = item.panel.html;
    this.makeEditable(panelContent, { placeholder: 'Tab content...' });

    panel.appendChild(panelContent);
    this.panelsEl.appendChild(panel);
  }

  private showTab(index: number): void {
    this.activeTabIndex = index;

    // Update tab styling
    const tabs = this.tabListEl.querySelectorAll('.govuk-tabs__list-item');
    tabs.forEach((tab, i) => {
      tab.classList.toggle('govuk-tabs__list-item--selected', i === index);
    });

    // Show/hide panels
    const panels = this.panelsEl.querySelectorAll('.govuk-tabs__panel');
    panels.forEach((panel, i) => {
      (panel as HTMLElement).classList.toggle('govuk-tabs__panel--hidden', i !== index);
    });
  }

  private addNewTab(): void {
    const newIndex = this.data.items.length;
    const label = `Tab ${newIndex + 1}`;
    const newItem: TabItemData = {
      label,
      id: slugify(label),
      panel: { html: '' },
    };
    this.data.items.push(newItem);
    this.rerender();
    this.showTab(newIndex);
  }

  private removeTab(index: number): void {
    if (this.data.items.length <= 1) return;
    this.data = this.extractData();
    this.data.items.splice(index, 1);
    if (this.activeTabIndex >= this.data.items.length) {
      this.activeTabIndex = this.data.items.length - 1;
    }
    this.rerender();
    this.showTab(this.activeTabIndex);
  }

  extractData(): TabsData {
    const items: TabItemData[] = [];
    const tabLinks = this.tabListEl.querySelectorAll('.govuk-tabs__tab');
    const panels = this.panelsEl.querySelectorAll('.govuk-editor-tab-content');
    const usedIds = new Set<string>();

    for (let i = 0; i < tabLinks.length; i++) {
      const tabLink = tabLinks[i] as HTMLElement;
      const panel = panels[i] as HTMLElement;
      const label = this.getEditableText(tabLink);

      // Derive ID from label, deduplicating if necessary
      let id = slugify(label);
      if (usedIds.has(id)) {
        let suffix = 2;
        while (usedIds.has(`${id}-${suffix}`)) suffix++;
        id = `${id}-${suffix}`;
      }
      usedIds.add(id);

      items.push({
        label,
        id,
        panel: { html: panel ? this.getEditableHtml(panel) : '' },
      });
    }

    return { items: items.length ? items : this.defaultData.items };
  }
}
