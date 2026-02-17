import { GovukBlockTool } from '../base/govuk-block-tool.js';
import { icons } from '../icons/index.js';

export interface AccordionItemData {
  heading: { text: string };
  summary?: { text: string };
  content: { html: string };
}

export interface AccordionData {
  id: string;
  items: AccordionItemData[];
}

export class GovukAccordion extends GovukBlockTool<AccordionData> {
  private containerEl!: HTMLElement;
  private sectionsEl!: HTMLElement;
  private static instanceCount = 0;

  static get toolbox() {
    return { title: 'Accordion', icon: icons.accordion };
  }

  static get sanitize() {
    return {
      items: {
        heading: { text: {} },
        content: {
          html: {
            br: true, a: { href: true }, strong: true, em: true,
            p: { class: true }, ul: { class: true }, ol: { class: true }, li: true,
          },
        },
      },
    };
  }

  get defaultData(): AccordionData {
    GovukAccordion.instanceCount++;
    return {
      id: `accordion-${GovukAccordion.instanceCount}`,
      items: [
        {
          heading: { text: 'Section 1' },
          content: { html: '' },
        },
      ],
    };
  }

  renderEdit(): HTMLElement {
    this.containerEl = document.createElement('div');
    this.containerEl.className = 'govuk-editor-accordion-container';

    this.sectionsEl = document.createElement('div');
    this.sectionsEl.className = 'govuk-accordion govuk-editor-accordion--editing';
    this.sectionsEl.setAttribute('data-module', 'govuk-accordion');

    for (const item of this.data.items) {
      this.addSection(item);
    }

    this.containerEl.appendChild(this.sectionsEl);

    if (!this.readOnly) {
      this.containerEl.appendChild(
        this.createAddButton('Add section', () => this.addNewSection())
      );
    }

    return this.containerEl;
  }

  private addSection(item: AccordionItemData): HTMLElement {
    const section = document.createElement('div');
    section.className = 'govuk-accordion__section govuk-accordion__section--expanded';

    const header = document.createElement('div');
    header.className = 'govuk-accordion__section-header';

    const heading = document.createElement('h2');
    heading.className = 'govuk-accordion__section-heading';

    const headingText = document.createElement('span');
    headingText.className = 'govuk-accordion__section-button';
    headingText.textContent = item.heading.text;
    this.makeEditable(headingText, { placeholder: 'Section heading...' });

    heading.appendChild(headingText);
    header.appendChild(heading);

    const content = document.createElement('div');
    content.className = 'govuk-accordion__section-content';

    const contentInner = document.createElement('div');
    contentInner.className = 'govuk-editor-accordion-content';
    contentInner.innerHTML = item.content.html;
    this.makeEditable(contentInner, { placeholder: 'Section content...' });

    content.appendChild(contentInner);

    section.appendChild(header);
    section.appendChild(content);

    if (!this.readOnly) {
      const removeBtn = this.createRemoveButton(() => {
        if (this.sectionsEl.children.length > 1) {
          section.remove();
        }
      });
      removeBtn.className += ' govuk-editor-accordion-remove';
      header.appendChild(removeBtn);
    }

    this.sectionsEl.appendChild(section);
    return section;
  }

  private addNewSection(): void {
    const section = this.addSection({
      heading: { text: '' },
      content: { html: '' },
    });
    const headingEl = section.querySelector('.govuk-accordion__section-button') as HTMLElement;
    if (headingEl) headingEl.focus();
  }

  extractData(): AccordionData {
    const items: AccordionItemData[] = [];

    for (const section of Array.from(this.sectionsEl.querySelectorAll('.govuk-accordion__section'))) {
      const headingEl = section.querySelector('.govuk-accordion__section-button') as HTMLElement;
      const contentEl = section.querySelector('.govuk-editor-accordion-content') as HTMLElement;

      if (headingEl && contentEl) {
        items.push({
          heading: { text: this.getEditableText(headingEl) },
          content: { html: this.getEditableHtml(contentEl) },
        });
      }
    }

    return {
      id: this.data.id,
      items: items.length ? items : this.defaultData.items,
    };
  }
}
