import { describe, it, expect, jest } from '@jest/globals';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { IncidentsListScreen } from './IncidentsListScreen';
import type { Incident } from '../incidents/schemas';

const incidents: Incident[] = [
  {
    id: 'i1',
    status: 'draft',
    startedAtISO: '2026-05-24T10:00:00Z',
    title: 'Euston ramp',
    events: [],
  },
  {
    id: 'i2',
    status: 'in_progress',
    startedAtISO: '2026-05-20T10:00:00Z',
    title: 'Manchester delay',
    sentAtISO: '2026-05-20T11:00:00Z',
    events: [],
  },
  {
    id: 'i3',
    status: 'completed',
    startedAtISO: '2026-04-01T10:00:00Z',
    title: 'Crewe resolved',
    events: [],
  },
];

describe('IncidentsListScreen', () => {
  it('renders the new-report CTA prominently', () => {
    render(<IncidentsListScreen incidents={[]} onNewReport={() => {}} onOpenIncident={() => {}} />);
    expect(screen.getByRole('button', { name: /start a new report/i })).toBeTruthy();
  });

  it('renders the three filter chips with row counts', () => {
    render(
      <IncidentsListScreen
        incidents={incidents}
        onNewReport={() => {}}
        onOpenIncident={() => {}}
      />,
    );
    expect(screen.getByRole('switch', { name: /drafts \(1\)/i })).toBeTruthy();
    expect(screen.getByRole('switch', { name: /in progress \(1\)/i })).toBeTruthy();
    expect(screen.getByRole('switch', { name: /completed \(1\)/i })).toBeTruthy();
  });

  it('defaults to the In Progress filter', () => {
    render(
      <IncidentsListScreen
        incidents={incidents}
        onNewReport={() => {}}
        onOpenIncident={() => {}}
      />,
    );
    expect(screen.queryByText('Manchester delay')).toBeTruthy();
    expect(screen.queryByText('Euston ramp')).toBeNull();
  });

  it('switching to Drafts shows draft rows', () => {
    render(
      <IncidentsListScreen
        incidents={incidents}
        onNewReport={() => {}}
        onOpenIncident={() => {}}
      />,
    );
    fireEvent.press(screen.getByRole('switch', { name: /drafts/i }));
    expect(screen.getByText('Euston ramp')).toBeTruthy();
    expect(screen.queryByText('Manchester delay')).toBeNull();
  });

  it('tapping a row calls onOpenIncident with the id', () => {
    const onOpenIncident = jest.fn<(id: string) => void>();
    render(
      <IncidentsListScreen
        incidents={incidents}
        onNewReport={() => {}}
        onOpenIncident={onOpenIncident}
      />,
    );
    fireEvent.press(screen.getByText('Manchester delay'));
    expect(onOpenIncident).toHaveBeenCalledWith('i2');
  });

  it('tapping Start a new report calls onNewReport', () => {
    const onNewReport = jest.fn();
    render(
      <IncidentsListScreen incidents={[]} onNewReport={onNewReport} onOpenIncident={() => {}} />,
    );
    fireEvent.press(screen.getByRole('button', { name: /start a new report/i }));
    expect(onNewReport).toHaveBeenCalledTimes(1);
  });

  it('shows an empty-state message when the active filter is empty', () => {
    render(<IncidentsListScreen incidents={[]} onNewReport={() => {}} onOpenIncident={() => {}} />);
    expect(screen.getByText(/no incidents in progress/i)).toBeTruthy();
  });
});
