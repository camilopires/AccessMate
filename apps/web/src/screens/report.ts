import { h, mount } from '../dom';
import { OPERATORS, SCENARIOS } from '../data';
import { newIncidentId, saveIncident, getProfile } from '../store';
import { assembleDraft } from '@accessmate/shared';
import type { Incident } from '@accessmate/shared';

interface DraftState {
  whenISO: string;
  operatorId: string | null;
  scenarioId: string | null;
  accompanied: boolean | null;
}

export function renderReport(target: HTMLElement, go: (hash: string) => void): void {
  const today = new Date().toISOString().slice(0, 10);
  const state: DraftState = {
    whenISO: today,
    operatorId: null,
    scenarioId: null,
    accompanied: null,
  };

  const header = h(
    'header',
    {},
    h('p', { className: 'overline' }, 'New report'),
    h('h1', {}, 'What happened?'),
    h(
      'p',
      { className: 'muted' },
      'Four short steps. You can edit anything before sending.',
    ),
  );

  const whenField = h(
    'label',
    { className: 'field' },
    h('span', {}, 'When did this happen?'),
    (() => {
      const input = h('input', {
        type: 'date',
        onchange: (e: Event) => {
          state.whenISO = (e.target as HTMLInputElement).value;
        },
      });
      (input as HTMLInputElement).value = today;
      return input;
    })(),
  );

  const operatorField = h(
    'label',
    { className: 'field' },
    h('span', {}, 'Which operator?'),
    (() => {
      const sel = h('select', {
        onchange: (e: Event) => {
          state.operatorId = (e.target as HTMLSelectElement).value || null;
        },
      });
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = '— Pick an operator —';
      sel.appendChild(placeholder);
      for (const op of OPERATORS) {
        const o = document.createElement('option');
        o.value = op.id;
        o.textContent = op.name;
        sel.appendChild(o);
      }
      return sel;
    })(),
  );

  const scenarioField = h(
    'label',
    { className: 'field' },
    h('span', {}, 'What kind of failure?'),
    (() => {
      const sel = h('select', {
        onchange: (e: Event) => {
          state.scenarioId = (e.target as HTMLSelectElement).value || null;
        },
      });
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = '— Pick a scenario —';
      sel.appendChild(placeholder);
      for (const sc of SCENARIOS) {
        const o = document.createElement('option');
        o.value = sc.id;
        o.textContent = sc.title;
        sel.appendChild(o);
      }
      return sel;
    })(),
  );

  const accompaniedField = h(
    'div',
    { className: 'chips', role: 'radiogroup', 'aria-label': 'Were you alone or accompanied?' },
    h(
      'button',
      {
        type: 'button',
        className: 'chip',
        role: 'radio',
        'aria-checked': 'false',
        onclick: (e: Event) => {
          state.accompanied = false;
          updateChips(e.currentTarget as HTMLElement);
        },
      },
      'Alone',
    ),
    h(
      'button',
      {
        type: 'button',
        className: 'chip',
        role: 'radio',
        'aria-checked': 'false',
        onclick: (e: Event) => {
          state.accompanied = true;
          updateChips(e.currentTarget as HTMLElement);
        },
      },
      'With a companion',
    ),
  );

  function updateChips(active: HTMLElement): void {
    accompaniedField.querySelectorAll('button').forEach((b) => {
      b.setAttribute('aria-checked', b === active ? 'true' : 'false');
    });
  }

  const accompaniedWrap = h(
    'label',
    { className: 'field' },
    h('span', {}, 'Were you alone or accompanied?'),
    accompaniedField,
  );

  const submit = h(
    'button',
    {
      onclick: () => {
        if (!state.operatorId || !state.scenarioId) {
          alert('Please pick an operator and a scenario before drafting.');
          return;
        }
        const operator = OPERATORS.find((o) => o.id === state.operatorId);
        const template = SCENARIOS.find((s) => s.id === state.scenarioId);
        if (!operator || !template) return;
        const draftBody = assembleDraft({
          template,
          facts: {
            whenISO: `${state.whenISO}T12:00:00Z`,
            operatorName: operator.name,
            scenarioId: template.id,
            accompanied: state.accompanied ?? undefined,
          },
          operator,
          profile: getProfile(),
        });
        const inc: Incident = {
          id: newIncidentId(),
          status: 'draft',
          startedAtISO: `${state.whenISO}T12:00:00Z`,
          title: `${template.title} — ${operator.name}`,
          facts: {
            whenISO: `${state.whenISO}T12:00:00Z`,
            operatorName: operator.name,
            scenarioId: template.id,
            accompanied: state.accompanied ?? undefined,
          },
          templateId: template.id,
          draftBody,
          recipient: operator.complaintsRoute.primaryEmail,
          operatorId: operator.id,
        };
        saveIncident(inc);
        go(`/incident/${inc.id}`);
      },
    },
    h('span', {}, 'Draft complaint'),
    h('span', { className: 'hint' }, 'Assembles a complaint you can edit before sending'),
  );

  const cancel = h(
    'button',
    { className: 'ghost', onclick: () => go('/incidents') },
    h('span', {}, 'Cancel'),
  );

  mount(
    target,
    header,
    h('section', { className: 'card col' }, whenField, operatorField, scenarioField, accompaniedWrap),
    submit,
    cancel,
  );
}
