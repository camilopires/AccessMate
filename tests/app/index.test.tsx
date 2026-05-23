import { describe, it, expect, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';

jest.mock('../../src/incidents/factory', () => ({
  getIncidentStore: () => ({
    listInProgress: () => [],
    mediaFor: () => [],
  }),
}));

import HomeScreen from '../../app/index';

describe('HomeScreen', () => {
  it('renders the five big-tap actions', () => {
    render(<HomeScreen />);
    expect(screen.getByRole('button', { name: /plan a trip/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /your accessibility passport/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /recent incidents/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /i.?m travelling now/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /something went wrong/i })).toBeTruthy();
  });

  it('shows no resume banner when there are no in-progress incidents', () => {
    render(<HomeScreen />);
    expect(screen.queryByText(/incident.* in progress/i)).toBeNull();
  });
});
