import { GovukBlockTool } from '../base/govuk-block-tool.js';
import { icons } from '../icons/index.js';

export interface SummaryListRowData {
  key: { text: string };
  value: { html: string; /** @deprecated */ text?: string };
}

export interface SummaryListData {
  rows: SummaryListRowData[];
}

export class GovukSummaryList extends GovukBlockTool<SummaryListData> {
  private dlEl!: HTMLElement;

  static get toolbox() {
    return { title: 'Summary list', icon: icons.summaryList };
  }

  static get sanitize() {
    return {
      strong: { class: true },
      span: { class: true },
      em: true,
      a: { href: true },
      br: true,
    };
  }

  get defaultData(): SummaryListData {
    return {
      rows: [
        { key: { text: 'Key' }, value: { html: 'Value' } },
      ],
    };
  }

  /** Read value content, falling back from html to text for old data */
  private valueContent(value: SummaryListRowData['value']): string {
    return value.html ?? value.text ?? '';
  }

  renderEdit(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'govuk-editor-summary-list-container';

    this.dlEl = document.createElement('dl');
    this.dlEl.className = 'govuk-summary-list';

    for (const row of this.data.rows) {
      this.addRow(row);
    }

    container.appendChild(this.dlEl);

    if (!this.readOnly) {
      container.appendChild(
        this.createAddButton('Add row', () => this.addNewRow())
      );
    }

    return container;
  }

  private addRow(rowData: SummaryListRowData): HTMLElement {
    const row = document.createElement('div');
    row.className = 'govuk-summary-list__row';

    const dt = document.createElement('dt');
    dt.className = 'govuk-summary-list__key';
    dt.textContent = rowData.key.text;
    this.makeEditable(dt, { placeholder: 'Key' });

    const dd = document.createElement('dd');
    dd.className = 'govuk-summary-list__value';
    dd.innerHTML = this.valueContent(rowData.value);
    this.makeEditable(dd, { placeholder: 'Value' });

    row.appendChild(dt);
    row.appendChild(dd);

    if (!this.readOnly) {
      const actions = document.createElement('dd');
      actions.className = 'govuk-summary-list__actions';
      actions.appendChild(
        this.createRemoveButton(() => {
          if (this.dlEl.children.length > 1) {
            row.remove();
          }
        })
      );
      row.appendChild(actions);
    }

    this.dlEl.appendChild(row);
    return row;
  }

  private addNewRow(): void {
    const row = this.addRow({ key: { text: '' }, value: { html: '' } });
    const dt = row.querySelector('dt');
    if (dt) (dt as HTMLElement).focus();
  }

  extractData(): SummaryListData {
    const rows: SummaryListRowData[] = [];
    for (const row of Array.from(this.dlEl.querySelectorAll('.govuk-summary-list__row'))) {
      const dt = row.querySelector('.govuk-summary-list__key') as HTMLElement;
      const dd = row.querySelector('.govuk-summary-list__value') as HTMLElement;
      if (dt && dd) {
        rows.push({
          key: { text: this.getEditableText(dt) },
          value: { html: this.getEditableHtml(dd) },
        });
      }
    }
    return { rows: rows.length ? rows : this.defaultData.rows };
  }
}
