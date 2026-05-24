import { renderIncidents } from './screens/incidents';
import { renderPassport } from './screens/passport';
import { renderSettings } from './screens/settings';
import { renderReport } from './screens/report';
import { renderIncidentDetail } from './screens/incident-detail';
import { renderProfileEdit } from './screens/profile-edit';
import { renderTabBar } from './screens/tabbar';
import { mount } from './dom';

type Route =
  | { name: 'incidents' }
  | { name: 'passport' }
  | { name: 'settings' }
  | { name: 'report' }
  | { name: 'incident'; id: string }
  | { name: 'profile-edit' };

function parseHash(): Route {
  const hash = location.hash.replace(/^#/, '') || '/incidents';
  if (hash === '/' || hash === '/incidents') return { name: 'incidents' };
  if (hash === '/passport') return { name: 'passport' };
  if (hash === '/settings') return { name: 'settings' };
  if (hash === '/report') return { name: 'report' };
  if (hash === '/profile/edit') return { name: 'profile-edit' };
  const m = hash.match(/^\/incident\/(.+)$/);
  if (m) return { name: 'incident', id: m[1] };
  return { name: 'incidents' };
}

export function navigate(hash: string): void {
  location.hash = hash;
}

export function startRouter(): void {
  const app = document.getElementById('app') as HTMLElement;
  const tabbar = document.getElementById('tabbar') as HTMLElement;

  const render = (): void => {
    const route = parseHash();
    mount(app);
    switch (route.name) {
      case 'incidents':
        renderIncidents(app, navigate);
        break;
      case 'passport':
        renderPassport(app, navigate);
        break;
      case 'settings':
        renderSettings(app);
        break;
      case 'report':
        renderReport(app, navigate);
        break;
      case 'incident':
        renderIncidentDetail(app, route.id, navigate);
        break;
      case 'profile-edit':
        renderProfileEdit(app, navigate);
        break;
    }
    renderTabBar(tabbar, route.name, navigate);
    window.scrollTo({ top: 0 });
    document.title = `AccessMate — ${pageName(route.name)}`;
  };

  window.addEventListener('hashchange', render);
  render();
}

function pageName(name: Route['name']): string {
  if (name === 'incidents') return 'Incidents';
  if (name === 'passport') return 'Passport';
  if (name === 'settings') return 'Settings';
  if (name === 'report') return 'New report';
  if (name === 'incident') return 'Incident';
  return 'Profile';
}
