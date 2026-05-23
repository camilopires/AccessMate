import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import HomeScreen from '../../app/index';

describe('HomeScreen', () => {
  it('renders the four big-tap actions', () => {
    render(<HomeScreen />);
    expect(screen.getByRole('button', { name: /plan a trip/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /your accessibility passport/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /i.?m travelling now/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /something went wrong/i })).toBeTruthy();
  });
});
