import { h, mount } from '../dom';
import { getIncident, setStatus, deleteIncident, updateIncident } from '../store';

export function renderIncidentDetail(
  target: HTMLElement,
  id: string,
  go: (hash: string) => void,
): void {
  const inc = getIncident(id);
  if (!inc) {
    mount(
      target,
      h('header', {}, h('h1', {}, 'Not found')),
      h('p', { className: 'muted' }, 'That incident no longer exists.'),
      h('button', { onclick: () => go('/incidents') }, 'Back to incidents'),
    );
    return;
  }

  const header = h(
    'header',
    {},
    h('p', { className: 'overline' }, inc.startedAtISO.slice(0, 10)),
    h('h1', {}, inc.title ?? 'Untitled incident'),
    h(
      'div',
      { className: 'row' },
      h('span', { className: `badge ${inc.status}` }, inc.status.replace('_', ' ')),
      inc.facts?.operatorName ? h('span', { className: 'muted' }, inc.facts.operatorName) : null,
    ),
  );

  const timeline = h(
    'section',
    { className: 'card' },
    h('p', { className: 'section-label' }, 'Timeline'),
    h('p', { className: 'timeline-line' }, `${inc.startedAtISO.slice(0, 10)} — Drafted`),
    inc.sentAtISO
      ? h(
          'p',
          { className: 'timeline-line' },
          `${inc.sentAtISO.slice(0, 10)} — Sent to ${inc.recipient ?? 'operator'}`,
        )
      : null,
    inc.resolvedAtISO
      ? h('p', { className: 'timeline-line' }, `${inc.resolvedAtISO.slice(0, 10)} — Resolved`)
      : null,
  );

  const body = inc.draftBody
    ? h(
        'section',
        { className: 'card' },
        h('p', { className: 'section-label' }, 'Outgoing letter'),
        h('pre', { className: 'body-block' }, inc.draftBody),
      )
    : null;

  const actions: HTMLElement[] = [];
  if (inc.status === 'draft') {
    actions.push(
      h(
        'button',
        {
          onclick: () => {
            const now = new Date().toISOString();
            updateIncident(inc.id, { status: 'in_progress', sentAtISO: now });
            location.hash = `/incident/${inc.id}`;
            location.reload();
          },
        },
        h('span', {}, 'Send to operator'),
        h(
          'span',
          { className: 'hint' },
          inc.recipient ? `Marks as sent to ${inc.recipient}` : 'Marks as sent',
        ),
      ),
      h(
        'button',
        {
          className: 'ghost',
          onclick: () => {
            if (!confirm('Discard this draft?')) return;
            deleteIncident(inc.id);
            go('/incidents');
          },
        },
        h('span', {}, 'Discard'),
      ),
    );
  } else if (inc.status === 'in_progress') {
    actions.push(
      h(
        'button',
        {
          onclick: () => {
            updateIncident(inc.id, { status: 'completed', resolvedAtISO: new Date().toISOString() });
            location.hash = `/incident/${inc.id}`;
            location.reload();
          },
        },
        h('span', {}, 'Mark as resolved'),
      ),
      h(
        'button',
        {
          className: 'secondary',
          onclick: () => window.print(),
        },
        h('span', {}, 'Print / save as PDF'),
        h('span', { className: 'hint' }, 'Uses your browser print dialog'),
      ),
      h(
        'button',
        {
          className: 'ghost',
          onclick: () => {
            setStatus(inc.id, 'draft');
            location.hash = `/incident/${inc.id}`;
            location.reload();
          },
        },
        h('span', {}, 'Move back to draft'),
      ),
    );
  } else if (inc.status === 'completed') {
    actions.push(
      h(
        'button',
        {
          className: 'secondary',
          onclick: () => window.print(),
        },
        h('span', {}, 'Print / save as PDF'),
        h('span', { className: 'hint' }, 'Uses your browser print dialog'),
      ),
      h(
        'button',
        {
          className: 'ghost',
          onclick: () => {
            setStatus(inc.id, 'in_progress');
            location.hash = `/incident/${inc.id}`;
            location.reload();
          },
        },
        h('span', {}, 'Re-open'),
      ),
    );
  }

  const back = h(
    'button',
    { className: 'ghost', onclick: () => go('/incidents') },
    h('span', {}, 'Back to incidents'),
  );

  mount(target, header, timeline, body, ...actions, back);
}
