import { GovukBlockTool } from '../base/govuk-block-tool.js';
import type { GovukMenuConfig } from '../base/govuk-block-tool.js';
import { icons } from '../icons/index.js';

export interface TagData {
  text: string;
  classes: string;
}

export const TAG_COLOURS = [
  { label: 'Default (blue)', classes: '' },
  { label: 'Grey', classes: 'govuk-tag--grey' },
  { label: 'Green', classes: 'govuk-tag--green' },
  { label: 'Turquoise', classes: 'govuk-tag--turquoise' },
  { label: 'Blue', classes: 'govuk-tag--blue' },
  { label: 'Light blue', classes: 'govuk-tag--light-blue' },
  { label: 'Purple', classes: 'govuk-tag--purple' },
  { label: 'Pink', classes: 'govuk-tag--pink' },
  { label: 'Red', classes: 'govuk-tag--red' },
  { label: 'Orange', classes: 'govuk-tag--orange' },
  { label: 'Yellow', classes: 'govuk-tag--yellow' },
];

export class GovukTag extends GovukBlockTool<TagData> {
  private tagEl!: HTMLElement;

  static get toolbox() {
    return { title: 'Tag', icon: icons.tag };
  }

  get defaultData(): TagData {
    return { text: 'Tag', classes: '' };
  }

  renderEdit(): HTMLElement {
    this.tagEl = document.createElement('strong');
    this.tagEl.className = `govuk-tag${this.data.classes ? ' ' + this.data.classes : ''}`;
    this.tagEl.textContent = this.data.text;

    this.makeEditable(this.tagEl, { placeholder: 'Tag text' });

    return this.tagEl;
  }

  extractData(): TagData {
    return {
      text: this.getEditableText(this.tagEl),
      classes: this.data.classes,
    };
  }

  renderSettings(): GovukMenuConfig {
    return TAG_COLOURS.map(({ label, classes }) => ({
      icon: icons.tag,
      label,
      isActive: this.data.classes === classes,
      closeOnActivate: true,
      onActivate: () => {
        this.data = { ...this.extractData(), classes };
        this.rerender();
      },
    }));
  }

}
