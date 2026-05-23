import { describe, it, expect, jest } from '@jest/globals';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { ProfileEditor } from './ProfileEditor';
import type { Profile } from './schemas';

const empty: Profile = { emergencyContacts: [] };

describe('ProfileEditor', () => {
  it('renders all five section headers', () => {
    render(<ProfileEditor profile={empty} onChange={() => {}} onSave={() => {}} />);
    expect(screen.getByText('Mobility')).toBeTruthy();
    expect(screen.getByText('Sensory')).toBeTruthy();
    expect(screen.getByText('Communication')).toBeTruthy();
    expect(screen.getByText('Medical')).toBeTruthy();
    expect(screen.getByText('Emergency contacts')).toBeTruthy();
  });

  it('toggling Uses wheelchair calls onChange with the new value', () => {
    const onChange = jest.fn<(p: Profile) => void>();
    render(<ProfileEditor profile={empty} onChange={onChange} onSave={() => {}} />);
    fireEvent.press(screen.getByRole('switch', { name: 'Uses wheelchair' }));
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0][0];
    expect(next.mobility?.usesWheelchair).toBe(true);
  });

  it('Save button calls onSave', () => {
    const onSave = jest.fn();
    render(<ProfileEditor profile={empty} onChange={() => {}} onSave={onSave} />);
    fireEvent.press(screen.getByRole('button', { name: /save profile/i }));
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('preserves existing chip selection when re-rendered', () => {
    const seeded: Profile = { emergencyContacts: [], mobility: { usesWheelchair: true } };
    render(<ProfileEditor profile={seeded} onChange={() => {}} onSave={() => {}} />);
    const node = screen.getByRole('switch', { name: 'Uses wheelchair' });
    expect(node.props.accessibilityState).toMatchObject({ checked: true });
  });
});
