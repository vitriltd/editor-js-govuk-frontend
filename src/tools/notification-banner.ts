import { GovukBlockTool } from '../base/govuk-block-tool.js';
import type { GovukMenuConfig } from '../base/govuk-block-tool.js';
import { icons } from '../icons/index.js';

export interface NotificationBannerData {
  type: '' | 'success';
  titleText: string;
  html: string;
}

export class GovukNotificationBanner extends GovukBlockTool<NotificationBannerData> {
  private titleEl!: HTMLElement;
  private contentEl!: HTMLElement;

  static get toolbox() {
    return { title: 'Notification banner', icon: icons.notificationBanner };
  }

  static get sanitize() {
    return {
      titleText: {},
      html: {
        br: true, a: { href: true, class: true }, strong: true, em: true,
        p: { class: true },
      },
    };
  }

  get defaultData(): NotificationBannerData {
    return { type: '', titleText: 'Important', html: '' };
  }

  renderEdit(): HTMLElement {
    const banner = document.createElement('div');
    banner.className = 'govuk-notification-banner';
    if (this.data.type === 'success') {
      banner.classList.add('govuk-notification-banner--success');
    }
    banner.setAttribute('role', this.data.type === 'success' ? 'alert' : 'region');
    banner.setAttribute('data-module', 'govuk-notification-banner');

    const header = document.createElement('div');
    header.className = 'govuk-notification-banner__header';

    this.titleEl = document.createElement('h2');
    this.titleEl.className = 'govuk-notification-banner__title';
    this.titleEl.textContent = this.data.titleText;
    this.makeEditable(this.titleEl, { placeholder: 'Banner title...' });

    header.appendChild(this.titleEl);

    const content = document.createElement('div');
    content.className = 'govuk-notification-banner__content';

    this.contentEl = document.createElement('div');
    this.contentEl.innerHTML = this.data.html;
    this.makeEditable(this.contentEl, { placeholder: 'Banner content...' });

    content.appendChild(this.contentEl);
    banner.appendChild(header);
    banner.appendChild(content);

    return banner;
  }

  extractData(): NotificationBannerData {
    return {
      type: this.data.type,
      titleText: this.getEditableText(this.titleEl),
      html: this.getEditableHtml(this.contentEl),
    };
  }

  renderSettings(): GovukMenuConfig {
    return [
      {
        icon: icons.notificationBanner,
        label: 'Default',
        isActive: this.data.type === '',
        closeOnActivate: true,
        onActivate: () => {
          this.data = { ...this.extractData(), type: '' };
          this.rerender();
        },
      },
      {
        icon: icons.notificationBanner,
        label: 'Success',
        isActive: this.data.type === 'success',
        closeOnActivate: true,
        onActivate: () => {
          this.data = { ...this.extractData(), type: 'success' };
          this.rerender();
        },
      },
    ];
  }

}
