import { GovukBlockTool } from '../base/govuk-block-tool.js';
import { icons } from '../icons/index.js';

export interface TableCellData {
  html: string;
  /** @deprecated Use `html` instead. Kept for backwards compatibility when loading old data. */
  text?: string;
}

export interface TableData {
  head: TableCellData[];
  rows: TableCellData[][];
}

export class GovukTable extends GovukBlockTool<TableData> {
  private tableEl!: HTMLTableElement;
  private theadRow!: HTMLTableRowElement;
  private tbody!: HTMLTableSectionElement;

  static get toolbox() {
    return { title: 'Table', icon: icons.table };
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

  get defaultData(): TableData {
    return {
      head: [{ html: 'Header 1' }, { html: 'Header 2' }, { html: 'Header 3' }],
      rows: [
        [{ html: '' }, { html: '' }, { html: '' }],
        [{ html: '' }, { html: '' }, { html: '' }],
      ],
    };
  }

  /** Read cell content, falling back from html to text for old data */
  private cellContent(cell: TableCellData): string {
    return cell.html ?? cell.text ?? '';
  }

  renderEdit(): HTMLElement {
    const container = document.createElement('div');
    container.className = 'govuk-editor-table-container';

    this.tableEl = document.createElement('table');
    this.tableEl.className = 'govuk-table';

    // Thead
    const thead = document.createElement('thead');
    thead.className = 'govuk-table__head';
    this.theadRow = document.createElement('tr');
    this.theadRow.className = 'govuk-table__row';

    for (const cell of this.data.head) {
      const th = document.createElement('th');
      th.className = 'govuk-table__header';
      th.setAttribute('scope', 'col');
      th.innerHTML = this.cellContent(cell);
      this.makeEditable(th, { placeholder: 'Header' });
      this.theadRow.appendChild(th);
    }

    thead.appendChild(this.theadRow);
    this.tableEl.appendChild(thead);

    // Tbody
    this.tbody = document.createElement('tbody');
    this.tbody.className = 'govuk-table__body';

    for (const row of this.data.rows) {
      this.addRow(row);
    }

    this.tableEl.appendChild(this.tbody);
    container.appendChild(this.tableEl);

    if (!this.readOnly) {
      const controls = document.createElement('div');
      controls.className = 'govuk-editor-table-controls';
      controls.appendChild(this.createAddButton('Add row', () => this.addNewRow()));
      controls.appendChild(this.createAddButton('Add column', () => this.addNewColumn()));
      container.appendChild(controls);
    }

    return container;
  }

  private addRow(cells: TableCellData[]): HTMLTableRowElement {
    const tr = document.createElement('tr');
    tr.className = 'govuk-table__row';

    for (const cell of cells) {
      const td = document.createElement('td');
      td.className = 'govuk-table__cell';
      td.innerHTML = this.cellContent(cell);
      this.makeEditable(td, { placeholder: '' });
      tr.appendChild(td);
    }

    if (!this.readOnly) {
      const actionTd = document.createElement('td');
      actionTd.className = 'govuk-editor-table-action';
      actionTd.appendChild(
        this.createRemoveButton(() => {
          if (this.tbody.rows.length > 1) {
            tr.remove();
          }
        })
      );
      tr.appendChild(actionTd);
    }

    this.tbody.appendChild(tr);
    return tr;
  }

  private addNewRow(): void {
    const colCount = this.data.head.length;
    const cells = Array.from({ length: colCount }, () => ({ html: '' }));
    const tr = this.addRow(cells);
    const firstCell = tr.querySelector('td');
    if (firstCell) firstCell.focus();
  }

  private addNewColumn(): void {
    // Add header
    const th = document.createElement('th');
    th.className = 'govuk-table__header';
    th.setAttribute('scope', 'col');
    th.textContent = '';
    this.makeEditable(th, { placeholder: 'Header' });
    // Insert before the last child if there's a remove button, or append
    this.theadRow.appendChild(th);

    // Add cell to each row
    for (const tr of Array.from(this.tbody.rows)) {
      const td = document.createElement('td');
      td.className = 'govuk-table__cell';
      this.makeEditable(td, { placeholder: '' });
      // Insert before the action td
      const actionTd = tr.querySelector('.govuk-editor-table-action');
      if (actionTd) {
        tr.insertBefore(td, actionTd);
      } else {
        tr.appendChild(td);
      }
    }

    // Update internal data to match
    this.data = this.extractData();
  }

  extractData(): TableData {
    const head: TableCellData[] = [];
    for (const th of Array.from(this.theadRow.querySelectorAll('th'))) {
      head.push({ html: this.getEditableHtml(th as HTMLElement) });
    }

    const rows: TableCellData[][] = [];
    for (const tr of Array.from(this.tbody.rows)) {
      const row: TableCellData[] = [];
      for (const td of Array.from(tr.querySelectorAll('td:not(.govuk-editor-table-action)'))) {
        row.push({ html: this.getEditableHtml(td as HTMLElement) });
      }
      rows.push(row);
    }

    return { head, rows };
  }
}
