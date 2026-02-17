import { GovukBlockTool } from '../base/govuk-block-tool.js';
import type { GovukMenuConfig } from '../base/govuk-block-tool.js';
import { icons } from '../icons/index.js';

export interface SectionBreakData {
  size: 'xl' | 'l' | 'm';
  visible: boolean;
}

export class GovukSectionBreak extends GovukBlockTool<SectionBreakData> {
  private hrEl!: HTMLElement;

  static get toolbox() {
    return { title: 'Section break', icon: icons.sectionBreak };
  }

  get defaultData(): SectionBreakData {
    return { size: 'xl', visible: true };
  }

  renderEdit(): HTMLElement {
    this.hrEl = document.createElement('hr');
    this.applyClasses();
    return this.hrEl;
  }

  private applyClasses(): void {
    this.hrEl.className = `govuk-section-break govuk-section-break--${this.data.size}`;
    if (this.data.visible) {
      this.hrEl.classList.add('govuk-section-break--visible');
    }
  }

  extractData(): SectionBreakData {
    return { size: this.data.size, visible: this.data.visible };
  }

  renderSettings(): GovukMenuConfig {
    const sizes: { label: string; size: SectionBreakData['size'] }[] = [
      { label: 'Extra large', size: 'xl' },
      { label: 'Large', size: 'l' },
      { label: 'Medium', size: 'm' },
    ];

    return [
      ...sizes.map(({ label, size }) => ({
        icon: icons.sectionBreak,
        label,
        isActive: this.data.size === size,
        closeOnActivate: true,
        onActivate: () => {
          this.data = { ...this.data, size };
          this.applyClasses();
        },
      })),
      {
        icon: icons.sectionBreak,
        label: 'Visible line',
        isActive: this.data.visible,
        closeOnActivate: true,
        onActivate: () => {
          this.data = { ...this.data, visible: !this.data.visible };
          this.applyClasses();
        },
      },
    ];
  }
}
