import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const pages = [
  {
    livePath: '/design/launcher-current-view.live.html',
    outputPath: resolve('design/launcher-current-view.html')
  },
  {
    livePath: '/design/settings-current-view.live.html',
    outputPath: resolve('design/settings-current-view.html')
  }
];

function serializeAttributes(attributes) {
  if (attributes.length === 0) {
    return '';
  }

  return attributes.map(([name, value]) => ` ${name}="${value}"`).join('');
}

async function exportPage(browser, baseUrl, pageConfig) {
  const page = await browser.newPage();
  const pageErrors = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      globalThis.console.warn(`[design export console] ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
  });

  await page.goto(`${baseUrl}${pageConfig.livePath}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2500);

  const cssText = await page.evaluate(() =>
    Array.from(globalThis.document.styleSheets)
      .map((styleSheet) => {
        try {
          return Array.from(styleSheet.cssRules)
            .map((rule) => rule.cssText)
            .join('\n');
        } catch {
          return '';
        }
      })
      .filter(Boolean)
      .join('\n')
  );

  const snapshot = await page.evaluate(() => {
    const doc = globalThis.document;
    const bodyClone = doc.body.cloneNode(true);
    bodyClone.querySelectorAll('script').forEach((script) => script.remove());
    return {
      bodyAttributes: Array.from(doc.body.attributes).map((attribute) => [attribute.name, attribute.value]),
      bodyHtml: bodyClone.innerHTML,
      lang: doc.documentElement.lang || 'en',
      title: doc.title
    };
  });

  await page.close();

  if (pageErrors.length > 0) {
    throw new Error(
      [`Failed to export ${pageConfig.livePath}`, ...pageErrors].join('\n')
    );
  }

  const html = `<!doctype html>
<html lang="${snapshot.lang}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${snapshot.title}</title>
    <style>
${cssText}
    </style>
  </head>
  <body${serializeAttributes(snapshot.bodyAttributes)}>
${snapshot.bodyHtml}
  </body>
</html>
`;

  await writeFile(pageConfig.outputPath, html, 'utf8');
  globalThis.console.log(
    `[design export] ${pageConfig.livePath} -> ${pageConfig.outputPath} (body ${snapshot.bodyHtml.length} chars, css ${cssText.length} chars)`
  );
}

export async function exportDesignHtml(baseUrl) {
  const browser = await chromium.launch();
  try {
    for (const page of pages) {
      await exportPage(browser, baseUrl, page);
    }
  } finally {
    await browser.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const baseUrl = process.argv[2];
  if (!baseUrl) {
    throw new Error('Base URL is required');
  }

  await exportDesignHtml(baseUrl);
}
