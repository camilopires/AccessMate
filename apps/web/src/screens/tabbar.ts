import { h, mount } from '../dom';

const TABS: { key: string; label: string; route: string }[] = [
  { key: 'incidents', label: 'Incidents', route: '/incidents' },
  { key: 'passport', label: 'Passport', route: '/passport' },
  { key: 'settings', label: 'Settings', route: '/settings' },
];

export function renderTabBar(
  target: HTMLElement,
  current: string,
  go: (hash: string) => void,
): void {
  const buttons = TABS.map((tab) => {
    const isCurrent = current === tab.key || (current === 'incident' && tab.key === 'incidents');
    return h(
      'button',
      {
        role: 'tab',
        'aria-current': isCurrent ? 'page' : null,
        onclick: () => go(tab.route),
      },
      tab.label,
    );
  });
  mount(target, ...buttons);
}
