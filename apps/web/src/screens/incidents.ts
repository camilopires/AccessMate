import { h, mount } from '../dom';
import { listIncidents } from '../store';
import type { Incident, IncidentStatus } from '@accessmate/shared';

const FILTERS: { id: IncidentStatus; label: string }[] = [
  { id: 'draft', label: 'Drafts' },
  { id: 'in_progress', label: 'In progress' },
  { id: 'completed', label: 'Completed' },
];

const EMPTY: Record<IncidentStatus, string> = {
  draft: 'No drafts. Tap Start a new report to begin.',
  in_progress: 'No incidents in progress.',
  completed: 'No completed incidents yet.',
  discarded: '',
};

export function renderIncidents(target: HTMLElement, go: (hash: string) => void): void {
  let filter: IncidentStatus = 'in_progress';

  const draw = (): void => {
    const incidents = listIncidents().filter((i) => i.status !== 'discarded');
    const counts: Record<IncidentStatus, number> = {
      draft: incidents.filter((i) => i.status === 'draft').length,
      in_progress: incidents.filter((i) => i.status === 'in_progress').length,
      completed: incidents.filter((i) => i.status === 'completed').length,
      discarded: 0,
    };
    const visible = incidents.filter((i) => i.status === filter);

    const header = h(
      'header',
      {},
      h('p', { className: 'overline' }, 'Today'),
      h('h1', {}, 'Incidents'),
    );

    const emergency = h(
      'button',
      { className: 'emergency', onclick: () => go('/report') },
      h('span', {}, 'Start a new report'),
      h(
        'span',
        { className: 'hint' },
        "Tell AccessMate what happened — we'll guide you through it.",
      ),
    );
    const emergencySection = h('section', { className: 'card emergency' }, emergency);

    const chips = h(
      'div',
      { className: 'chips', role: 'tablist' },
      ...FILTERS.map((f) =>
        h(
          'button',
          {
            className: 'chip',
            role: 'tab',
            'aria-checked': filter === f.id ? 'true' : 'false',
            onclick: () => {
              filter = f.id;
              draw();
            },
          },
          `${f.label} (${counts[f.id]})`,
        ),
      ),
    );
    const filterCard = h('section', { className: 'card' }, chips);

    const list =
      visible.length === 0
        ? (h('p', { className: 'muted' }, EMPTY[filter]) as HTMLElement)
        : (h(
            'section',
            { className: 'card' },
            h(
              'ul',
              { className: 'list' },
              ...visible.map((inc) => renderRow(inc, go)),
            ),
          ) as HTMLElement);

    mount(target, header, emergencySection, filterCard, list);
  };

  draw();
}

function renderRow(inc: Incident, go: (hash: string) => void): HTMLLIElement {
  const button = h(
    'button',
    {
      className: 'secondary',
      onclick: () => go(`/incident/${inc.id}`),
    },
    h(
      'div',
      { className: 'row', style: 'justify-content:space-between;width:100%' },
      h(
        'div',
        { className: 'col', style: 'gap:2px' },
        h('strong', {}, inc.title ?? 'Untitled incident'),
        h(
          'span',
          { className: 'hint' },
          `${inc.startedAtISO.slice(0, 10)}${inc.facts?.operatorName ? ` · ${inc.facts.operatorName}` : ''}`,
        ),
      ),
      h(
        'span',
        { className: `badge ${inc.status}` },
        inc.status.replace('_', ' '),
      ),
    ),
  );
  return h('li', {}, button) as HTMLLIElement;
}
