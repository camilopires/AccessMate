import { describe, it, expect, jest } from '@jest/globals';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { ProfileChip } from './ProfileChip';

describe('ProfileChip', () => {
  it('renders its label', () => {
    render(<ProfileChip label="Uses wheelchair" selected={false} onToggle={() => {}} />);
    expect(screen.getByText('Uses wheelchair')).toBeTruthy();
  });

  it('calls onToggle when pressed', () => {
    const onToggle = jest.fn();
    render(<ProfileChip label="Blue Badge holder" selected={false} onToggle={onToggle} />);
    fireEvent.press(screen.getByRole('switch'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('exposes selected state via accessibilityState', () => {
    render(<ProfileChip label="Guide dog" selected={true} onToggle={() => {}} />);
    const node = screen.getByRole('switch');
    expect(node.props.accessibilityState).toMatchObject({ checked: true });
  });
});
