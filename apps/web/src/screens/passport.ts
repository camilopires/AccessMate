import { h, mount } from '../dom';
import { getProfile } from '../store';
import type { Profile } from '@accessmate/shared';

function isEmpty(p: Profile): boolean {
  return (
    !p.mobility &&
    !p.sensory &&
    !p.communication &&
    !p.notes
  );
}

export function renderPassport(target: HTMLElement, go: (hash: string) => void): void {
  const profile = getProfile();

  const header = h(
    'header',
    {},
    h('p', { className: 'overline' }, 'Show staff'),
    h('h1', {}, 'Accessibility passport'),
  );

  if (isEmpty(profile)) {
    const cta = h(
      'section',
      { className: 'card' },
      h('h2', {}, 'Set up your passport'),
      h(
        'p',
        {},
        'Staff can see your access needs at a glance. Takes about 90 seconds and stays on your device.',
      ),
      h(
        'button',
        { onclick: () => go('/profile/edit') },
        h('span', {}, 'Set up passport'),
        h('span', { className: 'hint' }, 'Fill in your accessibility profile'),
      ),
      h('p', { className: 'muted' }, 'You can skip anything and come back later.'),
    );
    mount(target, header, cta);
    return;
  }

  const sections: HTMLElement[] = [];

  if (profile.mobility) {
    sections.push(
      h(
        'section',
        { className: 'card' },
        h('p', { className: 'section-label' }, 'Mobility'),
        ...factsForMobility(profile),
      ),
    );
  }
  if (profile.sensory) {
    sections.push(
      h(
        'section',
        { className: 'card' },
        h('p', { className: 'section-label' }, 'Sensory'),
        ...factsForSensory(profile),
      ),
    );
  }
  if (profile.communication) {
    sections.push(
      h(
        'section',
        { className: 'card' },
        h('p', { className: 'section-label' }, 'Communication'),
        ...factsForCommunication(profile),
      ),
    );
  }
  if (profile.notes) {
    sections.push(
      h(
        'section',
        { className: 'card' },
        h('p', { className: 'section-label' }, 'Notes'),
        h('p', {}, profile.notes),
      ),
    );
  }

  const actions = h(
    'section',
    { className: 'col' },
    h(
      'button',
      { className: 'secondary', onclick: () => go('/profile/edit') },
      h('span', {}, 'Edit profile'),
      h('span', { className: 'hint' }, 'Update your accessibility profile'),
    ),
  );

  mount(target, header, ...sections, actions);
}

function factsForMobility(p: Profile): HTMLElement[] {
  const out: HTMLElement[] = [];
  const t = p.mobility?.wheelchairType;
  if (t === 'powered') out.push(h('p', {}, 'Powered wheelchair'));
  if (t === 'manual') out.push(h('p', {}, 'Manual wheelchair'));
  if (t === 'mobility-scooter') out.push(h('p', {}, 'Mobility scooter'));
  return out.length ? out : [h('p', { className: 'muted' }, 'No mobility facts saved.')];
}

function factsForSensory(p: Profile): HTMLElement[] {
  const out: HTMLElement[] = [];
  const s = p.sensory!;
  if (s.isBlind) out.push(h('p', {}, 'Blind'));
  if (s.isLowVision) out.push(h('p', {}, 'Low vision'));
  if (s.isDeaf) out.push(h('p', {}, 'Deaf'));
  if (s.isHardOfHearing) out.push(h('p', {}, 'Hard of hearing'));
  return out.length ? out : [h('p', { className: 'muted' }, 'No sensory facts saved.')];
}

function factsForCommunication(p: Profile): HTMLElement[] {
  const out: HTMLElement[] = [];
  const c = p.communication!;
  if (c.prefersBSL) out.push(h('p', {}, 'Prefers British Sign Language'));
  if (c.prefersWriting) out.push(h('p', {}, 'Prefers written communication'));
  if (c.needsExtraTime) out.push(h('p', {}, 'Needs extra time when speaking or reading'));
  return out.length ? out : [h('p', { className: 'muted' }, 'No communication preferences saved.')];
}
