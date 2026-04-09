import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { pathToFileURL } from 'node:url';
import { chromium } from '@playwright/test';

const pages = [
  {
    livePath: '/design/launcher-current-view.live.html',
    outputPath: resolve('design/launcher-current-view.html'),
    interactiveLauncherMock: true
  },
  {
    livePath: '/design/launcher-folder-preview.live.html',
    outputPath: resolve('design/launcher-folder-preview.html')
  },
  {
    livePath: '/design/launcher-app-preview.live.html',
    outputPath: resolve('design/launcher-app-preview.html')
  },
  {
    livePath: '/design/launcher-folder-listing-preview.live.html',
    outputPath: resolve('design/launcher-folder-listing-preview.html')
  },
  {
    livePath: '/design/launcher-file-preview.live.html',
    outputPath: resolve('design/launcher-file-preview.html')
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

function escapeInlineJson(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026');
}

async function captureLauncherStandaloneInteractionData(browser, page, baseUrl) {
  const currentPageData = await page.evaluate(() => {
    const resultPayloads = Array.from(globalThis.document.querySelectorAll('[data-launcher-role="result"]')).map((element) => ({
      id: element.getAttribute('data-result-id'),
      interaction: element.getAttribute('data-mock-interaction')
    }));

    return {
      results: resultPayloads,
      templates: {
        previewContentClass: globalThis.document.querySelector('[data-launcher-role="preview-content"]')?.className ?? '',
        previewTitleClass: globalThis.document.querySelector('[data-launcher-role="preview-title"]')?.className ?? '',
        previewSubtitleClass: globalThis.document.querySelector('[data-launcher-role="preview-subtitle"]')?.className ?? '',
        previewMediaFrameClass: globalThis.document.querySelector('[data-launcher-role="preview-media-frame"]')?.className ?? '',
        previewMediaImageClass: globalThis.document.querySelector('[data-launcher-role="preview-media-image"]')?.className ?? '',
        previewMetaClass: globalThis.document.querySelector('[data-launcher-role="preview-meta"]')?.className ?? '',
        previewMetaRowClass: globalThis.document.querySelector('[data-launcher-role="preview-meta-row"]')?.className ?? '',
        previewMetaLabelClass: globalThis.document.querySelector('[data-launcher-role="preview-meta-label"]')?.className ?? '',
        previewMetaValueClass: globalThis.document.querySelector('[data-launcher-role="preview-meta-value"]')?.className ?? '',
        footerShortcutClass: globalThis.document.querySelector('[data-launcher-role="footer-left"] [data-launcher-role="action-shortcuts"]')?.className ?? '',
        kbdClass: globalThis.document.querySelector('[data-launcher-role="footer-left"] [data-launcher-role="kbd"]')?.className ?? '',
        footerPrimaryTextClass: globalThis.document.querySelector('[data-launcher-role="footer-primary-text"]')?.className ?? ''
      }
    };
  });

  const filePreviewPage = await browser.newPage();
  await filePreviewPage.goto(`${baseUrl}/design/launcher-file-preview.live.html`, { waitUntil: 'networkidle' });
  await filePreviewPage.waitForTimeout(250);
  const filePreviewTemplate = await filePreviewPage.evaluate(() => ({
    previewBodyClass: globalThis.document.querySelector('[data-launcher-role="preview-body"]')?.className ?? ''
  }));
  await filePreviewPage.close();

  return {
    results: currentPageData.results,
    templates: {
      ...currentPageData.templates,
      ...filePreviewTemplate
    }
  };
}

function buildInteractiveLauncherScript(interactionData) {
  const serialized = escapeInlineJson(interactionData);
  return `
    <script>
      (() => {
        const interactiveData = ${serialized};
        const resultStateMap = new Map(
          (interactiveData.results || [])
            .filter((entry) => entry.id && entry.interaction)
            .map((entry) => {
              try {
                return [entry.id, JSON.parse(entry.interaction)];
              } catch {
                return null;
              }
            })
            .filter(Boolean)
        );

        const templates = interactiveData.templates || {};
        const previewPane = document.querySelector('[data-launcher-role="preview-pane"]');
        const footerPrimaryText = document.querySelector('[data-launcher-role="footer-primary-text"]');
        const footerShortcuts = document.querySelector('[data-launcher-role="footer-left"] [data-launcher-role="action-shortcuts"]');
        const previewHeader = document.querySelector('[data-launcher-role="preview-header"]');
        const placeholder = document.querySelector('[data-launcher-role="preview-placeholder"]');

        if (!previewPane) {
          return;
        }

        const ensurePreviewContent = () => {
          let previewContent = previewPane.querySelector('[data-launcher-role="preview-content"]');
          if (!previewContent) {
            placeholder?.remove();
            previewContent = document.createElement('div');
            previewContent.className = templates.previewContentClass || '';
            previewContent.setAttribute('data-launcher-role', 'preview-content');
            previewHeader?.insertAdjacentElement('afterend', previewContent);
          }

          return previewContent;
        };

        const ensureNode = (parent, role, className, tagName) => {
          let node = parent.querySelector('[data-launcher-role="' + role + '"]');
          if (!node) {
            node = document.createElement(tagName);
            if (className) {
              node.className = className;
            }
            node.setAttribute('data-launcher-role', role);
            parent.appendChild(node);
          }
          return node;
        };

        const renderShortcut = (hint) => {
          if (!hint || !footerShortcuts) {
            footerShortcuts && (footerShortcuts.innerHTML = '');
            return;
          }

          const kbdClass = templates.kbdClass || '';
          footerShortcuts.innerHTML = hint
            .split('+')
            .filter(Boolean)
            .map((part) => '<span class="' + kbdClass + '" data-launcher-role="kbd">' + (
              ({
                Cmd: '⌘',
                Ctrl: 'Ctrl',
                Shift: 'Shift',
                Alt: 'Alt',
                Enter: 'Enter',
                Backspace: 'Delete',
                Right: '→'
              })[part] || part
            ) + '</span>')
            .join('');
        };

        const renderPreview = (resultId) => {
          const state = resultStateMap.get(resultId);
          if (!state || !state.preview) {
            return;
          }

          const preview = state.preview;
          const previewContent = ensurePreviewContent();
          previewContent.innerHTML = '';

          const title = ensureNode(previewContent, 'preview-title', templates.previewTitleClass, 'div');
          title.textContent = preview.title || '';
          title.setAttribute('data-launcher-selectable', 'true');

          const subtitle = ensureNode(previewContent, 'preview-subtitle', templates.previewSubtitleClass, 'div');
          subtitle.textContent = preview.subtitle || '';
          subtitle.setAttribute('data-launcher-selectable', 'true');

          if (preview.mediaUrl) {
            const mediaFrame = ensureNode(previewContent, 'preview-media-frame', templates.previewMediaFrameClass, 'div');
            mediaFrame.innerHTML = '';
            const image = document.createElement('img');
            if (templates.previewMediaImageClass) {
              image.className = templates.previewMediaImageClass;
            }
            image.setAttribute('data-launcher-role', 'preview-media-image');
            image.src = preview.mediaUrl;
            image.alt = preview.mediaAlt || '';
            mediaFrame.appendChild(image);
          }

          if (preview.body) {
            const body = ensureNode(previewContent, 'preview-body', templates.previewBodyClass, 'pre');
            body.textContent = preview.body;
            body.setAttribute('data-launcher-selectable', 'true');
          }

          const meta = ensureNode(previewContent, 'preview-meta', templates.previewMetaClass, 'div');
          meta.innerHTML = '';
          for (const section of preview.sections || []) {
            const row = document.createElement('div');
            if (templates.previewMetaRowClass) {
              row.className = templates.previewMetaRowClass;
            }
            row.setAttribute('data-launcher-role', 'preview-meta-row');

            const label = document.createElement('span');
            if (templates.previewMetaLabelClass) {
              label.className = templates.previewMetaLabelClass;
            }
            label.setAttribute('data-launcher-role', 'preview-meta-label');
            label.setAttribute('data-launcher-selectable', 'true');
            label.textContent = section.label || '';

            const value = document.createElement('span');
            if (templates.previewMetaValueClass) {
              value.className = templates.previewMetaValueClass;
            }
            value.setAttribute('data-launcher-role', 'preview-meta-value');
            value.setAttribute('data-launcher-selectable', 'true');
            value.textContent = section.value || '';

            row.appendChild(label);
            row.appendChild(value);
            meta.appendChild(row);
          }

          if (footerPrimaryText) {
            footerPrimaryText.textContent = state.primaryAction?.label || 'Start typing or use recent results';
            if (templates.footerPrimaryTextClass) {
              footerPrimaryText.className = templates.footerPrimaryTextClass;
            }
          }
          renderShortcut(state.primaryAction?.hint || '');
        };

        const setSelected = (resultId) => {
          document.querySelectorAll('[data-launcher-role="result"]').forEach((node) => {
            node.setAttribute('data-selected', node.getAttribute('data-result-id') === resultId ? 'true' : 'false');
          });
          renderPreview(resultId);
        };

        document.querySelectorAll('[data-launcher-role="result"]').forEach((node) => {
          node.addEventListener('mouseenter', () => {
            const resultId = node.getAttribute('data-result-id');
            if (!resultId) {
              return;
            }
            setSelected(resultId);
          });
        });
      })();
    </script>`;
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

  const interactionData = pageConfig.interactiveLauncherMock
    ? await captureLauncherStandaloneInteractionData(browser, page, baseUrl)
    : null;

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
${interactionData ? buildInteractiveLauncherScript(interactionData) : ''}
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
