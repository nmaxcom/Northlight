import { launcherRuntime } from './runtime';
import type { ActionDescriptor, LauncherAction, LocalSearchItem } from './types';

export function buildLocalActionDescriptors(item: Pick<LocalSearchItem, 'path' | 'name' | 'kind'>): ActionDescriptor[] {
  const descriptors: ActionDescriptor[] = [
    {
      id: 'open',
      label: item.kind === 'app' ? 'Launch App' : item.kind === 'folder' ? 'Open Folder' : 'Open File',
      hint: 'Enter',
      group: 'Open',
      dismissOnRun: true,
      feedbackLabel: item.kind === 'app' ? 'Launched app' : item.kind === 'folder' ? 'Opened folder' : 'Opened file',
      targetPath: item.path,
      resultKind: item.kind
    },
    {
      id: 'reveal',
      label: item.kind === 'folder' ? 'Show Folder In Finder' : 'Reveal in Finder',
      hint: 'Cmd+Enter',
      group: 'Open',
      dismissOnRun: true,
      feedbackLabel: 'Revealed in Finder',
      targetPath: item.path
    },
    {
      id: 'copy-path',
      label: 'Copy Path',
      hint: 'Cmd+Shift+C',
      group: 'Copy',
      dismissOnRun: true,
      feedbackLabel: 'Copied path',
      text: item.path
    },
    {
      id: 'copy-name',
      label: 'Copy Name',
      hint: 'Cmd+Shift+N',
      group: 'Copy',
      dismissOnRun: true,
      feedbackLabel: 'Copied name',
      text: item.name
    }
  ];

  if (item.kind === 'folder') {
    descriptors.push({
      id: 'open-terminal',
      label: 'Open In Terminal',
      hint: 'Alt+Enter',
      group: 'Open',
      dismissOnRun: true,
      feedbackLabel: 'Opened in Terminal',
      targetPath: item.path
    });
  }

  if (item.kind === 'file') {
    descriptors.push(
      {
        id: 'open-with-text-edit',
        label: 'Open With TextEdit',
        hint: 'Alt+Enter',
        group: 'Open',
        dismissOnRun: true,
        feedbackLabel: 'Opened in TextEdit',
        targetPath: item.path
      },
      {
        id: 'quick-look',
        label: 'Quick Look',
        hint: 'Space',
        group: 'Open',
        dismissOnRun: false,
        feedbackLabel: 'Opened Quick Look',
        targetPath: item.path
      },
      {
        id: 'copy-markdown-link',
        label: 'Copy Markdown Link',
        hint: 'Cmd+Shift+M',
        group: 'Copy',
        dismissOnRun: true,
        feedbackLabel: 'Copied markdown link',
        text: `[${item.name}](${item.path})`
      }
    );
  }

  return descriptors;
}

export function buildCopyActionDescriptor(id: Extract<ActionDescriptor['id'], 'copy-result' | 'copy-full-expression' | 'copy-snippet' | 'copy-clipboard'>, label: string, text: string, hint = 'Enter', feedbackLabel = 'Copied') {
  return {
    id,
    label,
    hint,
    group: 'Copy',
    dismissOnRun: true,
    feedbackLabel,
    text
  } satisfies ActionDescriptor;
}

export function buildOpenSettingsActionDescriptor(): ActionDescriptor {
  return {
    id: 'open-settings',
    label: 'Open Settings',
    hint: 'Enter',
    group: 'Open',
    feedbackLabel: 'Opened settings'
  };
}

export function buildOpenSystemSettingsActionDescriptor(label: string, url: string): ActionDescriptor {
  return {
    id: 'open-system-settings',
    label,
    hint: 'Enter',
    group: 'Open',
    dismissOnRun: true,
    feedbackLabel: 'Opened System Settings',
    url
  };
}

export function resolveActionDescriptor(descriptor: ActionDescriptor): LauncherAction {
  switch (descriptor.id) {
    case 'open':
      return {
        id: descriptor.id,
        label: descriptor.label,
        hint: descriptor.hint,
        group: descriptor.group,
        feedbackLabel: descriptor.feedbackLabel,
        dismissOnRun: descriptor.dismissOnRun,
        run: async () => {
          launcherRuntime.recordSelection({
            path: descriptor.targetPath,
            name: descriptor.targetPath.split('/').at(-1) ?? descriptor.targetPath,
            kind: descriptor.resultKind
          });
          await launcherRuntime.openPath(descriptor.targetPath);
        }
      };
    case 'reveal':
      return {
        id: descriptor.id,
        label: descriptor.label,
        hint: descriptor.hint,
        group: descriptor.group,
        feedbackLabel: descriptor.feedbackLabel,
        dismissOnRun: descriptor.dismissOnRun,
        run: async () => {
          launcherRuntime.recordSelection({
            path: descriptor.targetPath,
            name: descriptor.targetPath.split('/').at(-1) ?? descriptor.targetPath,
            kind: descriptor.targetPath.endsWith('.app') ? 'app' : 'file'
          });
          await launcherRuntime.revealPath(descriptor.targetPath);
        }
      };
    case 'open-terminal':
      return {
        id: descriptor.id,
        label: descriptor.label,
        hint: descriptor.hint,
        group: descriptor.group,
        feedbackLabel: descriptor.feedbackLabel,
        dismissOnRun: descriptor.dismissOnRun,
        run: async () => {
          launcherRuntime.recordSelection({
            path: descriptor.targetPath,
            name: descriptor.targetPath.split('/').at(-1) ?? descriptor.targetPath,
            kind: 'folder'
          });
          await launcherRuntime.openInTerminal(descriptor.targetPath);
        }
      };
    case 'open-with-text-edit':
      return {
        id: descriptor.id,
        label: descriptor.label,
        hint: descriptor.hint,
        group: descriptor.group,
        feedbackLabel: descriptor.feedbackLabel,
        dismissOnRun: descriptor.dismissOnRun,
        run: async () => {
          launcherRuntime.recordSelection({
            path: descriptor.targetPath,
            name: descriptor.targetPath.split('/').at(-1) ?? descriptor.targetPath,
            kind: 'file'
          });
          await launcherRuntime.openWithTextEdit(descriptor.targetPath);
        }
      };
    case 'quick-look':
      return {
        id: descriptor.id,
        label: descriptor.label,
        hint: descriptor.hint,
        group: descriptor.group,
        feedbackLabel: descriptor.feedbackLabel,
        dismissOnRun: descriptor.dismissOnRun,
        run: async () => {
          await launcherRuntime.quickLookPath(descriptor.targetPath);
        }
      };
    case 'copy-path':
    case 'copy-name':
    case 'copy-markdown-link':
    case 'copy-result':
    case 'copy-full-expression':
    case 'copy-snippet':
    case 'copy-clipboard':
      return {
        id: descriptor.id,
        label: descriptor.label,
        hint: descriptor.hint,
        group: descriptor.group,
        feedbackLabel: descriptor.feedbackLabel,
        dismissOnRun: descriptor.dismissOnRun,
        run: () => launcherRuntime.copyText(descriptor.text)
      };
    case 'open-settings':
      return {
        id: descriptor.id,
        label: descriptor.label,
        hint: descriptor.hint,
        group: descriptor.group,
        feedbackLabel: descriptor.feedbackLabel,
        run: () => launcherRuntime.openSettings()
      };
    case 'open-system-settings':
      return {
        id: descriptor.id,
        label: descriptor.label,
        hint: descriptor.hint,
        group: descriptor.group,
        feedbackLabel: descriptor.feedbackLabel,
        dismissOnRun: descriptor.dismissOnRun,
        run: () => launcherRuntime.openSystemSettings(descriptor.url)
      };
  }
}
