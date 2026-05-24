import { h, mount } from '../dom';
import { getSettings, saveSettings, listIncidents } from '../store';

export function renderSettings(target: HTMLElement): void {
  const s = getSettings();

  const header = h(
    'header',
    {},
    h('p', { className: 'overline' }, 'Preferences'),
    h('h1', {}, 'Settings'),
  );

  const switchRow = (label: string, key: 'highContrast' | 'reduceMotion'): HTMLLabelElement => {
    const cb = h('input', {
      type: 'checkbox',
      onchange: (e: Event) => {
        const next = { ...s, [key]: (e.target as HTMLInputElement).checked };
        saveSettings(next);
      },
    });
    if (s[key]) (cb as HTMLInputElement).checked = true;
    return h(
      'label',
      { className: 'switch' },
      h('span', {}, label),
      cb,
      h('span', { className: 'track' }),
    ) as HTMLLabelElement;
  };

  const fontScale = h(
    'label',
    { className: 'field' },
    h('span', {}, `Font scale · ${s.fontScale.toFixed(1)}x`),
    (() => {
      const sel = h('select', {
        onchange: (e: Event) => {
          const next = { ...s, fontScale: Number((e.target as HTMLSelectElement).value) };
          saveSettings(next);
        },
      });
      for (const v of [1.0, 1.2, 1.4, 1.6, 2.0]) {
        const opt = document.createElement('option');
        opt.value = String(v);
        opt.textContent = `${v.toFixed(1)}x`;
        if (Math.abs(s.fontScale - v) < 0.01) opt.selected = true;
        sel.appendChild(opt);
      }
      return sel;
    })(),
  );

  const a11ySection = h(
    'section',
    { className: 'card' },
    h('p', { className: 'section-label' }, 'Accessibility'),
    switchRow('High contrast', 'highContrast'),
    switchRow('Reduce motion', 'reduceMotion'),
    fontScale,
  );

  const dataSection = h(
    'section',
    { className: 'card' },
    h('p', { className: 'section-label' }, 'Your data'),
    h(
      'button',
      {
        className: 'secondary',
        onclick: () => {
          const payload = {
            settings: getSettings(),
            incidents: listIncidents(),
          };
          const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `accessmate-export-${new Date().toISOString().slice(0, 10)}.json`;
          a.click();
          URL.revokeObjectURL(a.href);
        },
      },
      h('span', {}, 'Export all data (JSON)'),
      h('span', { className: 'hint' }, 'Download your profile and every incident on this device'),
    ),
    h(
      'button',
      {
        className: 'ghost',
        onclick: () => {
          if (!confirm('Wipe all AccessMate data on this device?')) return;
          localStorage.clear();
          location.hash = '/incidents';
          location.reload();
        },
      },
      h('span', {}, 'Wipe device data'),
      h('span', { className: 'hint' }, 'Permanently delete all locally stored AccessMate data'),
    ),
  );

  const about = h(
    'section',
    { className: 'card' },
    h('p', { className: 'section-label' }, 'About'),
    h(
      'p',
      {},
      'AccessMate is an accessibility-first travel companion. All data stays on your device unless you explicitly share or export it.',
    ),
  );

  mount(target, header, a11ySection, dataSection, about);
}
