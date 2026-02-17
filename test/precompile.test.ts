import { describe, it, expect } from 'vitest';
import { renderComponent } from '../src/nunjucks-runtime.js';
import fs from 'fs';
import path from 'path';

const GOVUK_DIST = path.resolve(
  import.meta.dirname,
  '../node_modules/govuk-frontend/dist/govuk'
);

const COMPONENTS = [
  'inset-text',
  'warning-text',
  'details',
  'panel',
  'tag',
  'button',
  'table',
  'accordion',
  'notification-banner',
  'summary-list',
  'tabs',
];

/**
 * Normalise whitespace for comparison.
 * Different environments may produce slightly different whitespace
 * in Nunjucks output. We collapse all runs of whitespace to single spaces.
 */
function normaliseHtml(html: string): string {
  return html.replace(/\s+/g, ' ').trim();
}

describe('Precompiled templates match govuk-frontend fixtures', () => {
  for (const component of COMPONENTS) {
    const fixturesPath = path.join(GOVUK_DIST, 'components', component, 'fixtures.json');
    if (!fs.existsSync(fixturesPath)) {
      describe.skip(component, () => {
        it('no fixtures.json found', () => {});
      });
    } else {
      const fixturesData = JSON.parse(fs.readFileSync(fixturesPath, 'utf-8'));
      const fixtures = fixturesData.fixtures;

      describe(component, () => {
        // Test the default fixture (first non-hidden one)
        const defaultFixture = fixtures.find((f: any) => !f.hidden && f.name === 'default');

        if (defaultFixture) {
          it(`renders "${defaultFixture.name}" fixture correctly`, () => {
            const rendered = renderComponent(component, defaultFixture.options);
            expect(normaliseHtml(rendered)).toBe(normaliseHtml(defaultFixture.html));
          });
        }

        // Also test a few non-hidden fixtures
        const visibleFixtures = fixtures.filter(
          (f: any) => !f.hidden && f.name !== 'default'
        ).slice(0, 3);

        for (const fixture of visibleFixtures) {
          it(`renders "${fixture.name}" fixture correctly`, () => {
            const rendered = renderComponent(component, fixture.options);
            expect(normaliseHtml(rendered)).toBe(normaliseHtml(fixture.html));
          });
        }
      });
    }
  }
});
