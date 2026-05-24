import { h, mount } from '../dom';
import { getProfile, saveProfile } from '../store';
import type { Profile } from '@accessmate/shared';

export function renderProfileEdit(target: HTMLElement, go: (hash: string) => void): void {
  const draft: Profile = JSON.parse(JSON.stringify(getProfile()));

  const switchInput = (
    label: string,
    checked: boolean,
    onChange: (v: boolean) => void,
  ): HTMLLabelElement => {
    const cb = h('input', {
      type: 'checkbox',
      onchange: (e: Event) => onChange((e.target as HTMLInputElement).checked),
    });
    if (checked) (cb as HTMLInputElement).checked = true;
    return h(
      'label',
      { className: 'switch' },
      h('span', {}, label),
      cb,
      h('span', { className: 'track' }),
    ) as HTMLLabelElement;
  };

  const wheelchair = h(
    'label',
    { className: 'field' },
    h('span', {}, 'Mobility aid'),
    (() => {
      const sel = h('select', {
        onchange: (e: Event) => {
          const value = (e.target as HTMLSelectElement).value as
            | ''
            | 'manual'
            | 'powered'
            | 'mobility-scooter';
          if (!value) {
            delete draft.mobility;
          } else {
            draft.mobility = { usesWheelchair: true, wheelchairType: value };
          }
        },
      });
      for (const [v, label] of [
        ['', 'None'],
        ['manual', 'Manual wheelchair'],
        ['powered', 'Powered wheelchair'],
        ['mobility-scooter', 'Mobility scooter'],
      ] as const) {
        const opt = document.createElement('option');
        opt.value = v;
        opt.textContent = label;
        if ((draft.mobility?.wheelchairType ?? '') === v) opt.selected = true;
        sel.appendChild(opt);
      }
      return sel;
    })(),
  );

  const sensorySection = h(
    'section',
    { className: 'card' },
    h('p', { className: 'section-label' }, 'Sensory'),
    switchInput('Blind', !!draft.sensory?.isBlind, (v) => {
      draft.sensory = { ...(draft.sensory ?? {}), isBlind: v };
    }),
    switchInput('Low vision', !!draft.sensory?.isLowVision, (v) => {
      draft.sensory = { ...(draft.sensory ?? {}), isLowVision: v };
    }),
    switchInput('Deaf', !!draft.sensory?.isDeaf, (v) => {
      draft.sensory = { ...(draft.sensory ?? {}), isDeaf: v };
    }),
    switchInput('Hard of hearing', !!draft.sensory?.isHardOfHearing, (v) => {
      draft.sensory = { ...(draft.sensory ?? {}), isHardOfHearing: v };
    }),
  );

  const communicationSection = h(
    'section',
    { className: 'card' },
    h('p', { className: 'section-label' }, 'Communication'),
    switchInput('Prefers British Sign Language', !!draft.communication?.prefersBSL, (v) => {
      draft.communication = { ...(draft.communication ?? {}), prefersBSL: v };
    }),
    switchInput('Prefers written communication', !!draft.communication?.prefersWriting, (v) => {
      draft.communication = { ...(draft.communication ?? {}), prefersWriting: v };
    }),
    switchInput('Needs extra time', !!draft.communication?.needsExtraTime, (v) => {
      draft.communication = { ...(draft.communication ?? {}), needsExtraTime: v };
    }),
  );

  const notes = h(
    'label',
    { className: 'field' },
    h('span', {}, 'Notes for staff'),
    (() => {
      const ta = h('textarea', {
        oninput: (e: Event) => {
          draft.notes = (e.target as HTMLTextAreaElement).value;
        },
      });
      (ta as HTMLTextAreaElement).value = draft.notes ?? '';
      return ta;
    })(),
  );

  const save = h(
    'button',
    {
      onclick: () => {
        saveProfile(draft);
        go('/passport');
      },
    },
    h('span', {}, 'Save profile'),
    h('span', { className: 'hint' }, 'Returns you to your passport'),
  );

  const back = h(
    'button',
    { className: 'ghost', onclick: () => go('/passport') },
    h('span', {}, 'Cancel'),
  );

  const header = h(
    'header',
    {},
    h('p', { className: 'overline' }, 'Profile'),
    h('h1', {}, 'Your accessibility profile'),
  );

  mount(
    target,
    header,
    h('section', { className: 'card' }, h('p', { className: 'section-label' }, 'Mobility'), wheelchair),
    sensorySection,
    communicationSection,
    h('section', { className: 'card' }, h('p', { className: 'section-label' }, 'Notes'), notes),
    save,
    back,
  );
}
