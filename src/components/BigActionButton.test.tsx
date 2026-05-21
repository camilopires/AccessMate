import { describe, it, expect, jest } from '@jest/globals';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { BigActionButton } from './BigActionButton';

describe('BigActionButton', () => {
  it('renders an accessible button with the given label', () => {
    render(<BigActionButton label="Plan a trip" onPress={() => {}} />);
    const btn = screen.getByRole('button', { name: 'Plan a trip' });
    expect(btn).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<BigActionButton label="Tap me" onPress={onPress} />);
    fireEvent.press(screen.getByRole('button', { name: 'Tap me' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('exposes accessibilityHint when provided', () => {
    render(<BigActionButton label="Help" hint="Opens the directory" onPress={() => {}} />);
    expect(screen.getByRole('button').props.accessibilityHint).toBe('Opens the directory');
  });
});
