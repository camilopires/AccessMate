import { describe, it, expect, jest } from '@jest/globals';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { PassportView } from './PassportView';
import type { Profile } from './schemas';

const filled: Profile = {
  emergencyContacts: [{ name: 'Jane Doe', phone: '+44-7700-900123', relationship: 'partner' }],
  mobility: {
    usesWheelchair: true,
    wheelchairType: 'powered',
    battery: { chemistry: 'lithium-ion', wattHours: 270, isDryCell: false, isSpillable: false },
    weightKg: 130,
  },
  sensory: { isHardOfHearing: true },
  communication: { needsExtraTime: true },
  medical: { carriesEpiPen: true, allergies: ['penicillin'] },
  blueBadge: { holder: true, number: 'XYZ123', expiryISO: '2028-01-01' },
};

describe('PassportView', () => {
  it('shows a clear empty state when nothing is filled in', () => {
    render(
      <PassportView profile={{ emergencyContacts: [] }} onEdit={() => {}} onExport={() => {}} />,
    );
    expect(screen.getByText(/passport is empty/i)).toBeTruthy();
  });

  it('shows mobility, sensory, comms, medical, blue-badge facts when filled', () => {
    render(<PassportView profile={filled} onEdit={() => {}} onExport={() => {}} />);
    expect(screen.getByText(/powered wheelchair/i)).toBeTruthy();
    expect(screen.getByText(/lithium.ion/i)).toBeTruthy();
    expect(screen.getByText(/270 Wh/i)).toBeTruthy();
    expect(screen.getByText(/hard of hearing/i)).toBeTruthy();
    expect(screen.getByText(/extra time/i)).toBeTruthy();
    expect(screen.getByText(/EpiPen/i)).toBeTruthy();
    expect(screen.getByText(/penicillin/i)).toBeTruthy();
    expect(screen.getByText(/UK Blue Badge holder/i)).toBeTruthy();
    expect(screen.getByText(/Jane Doe/)).toBeTruthy();
  });

  it('exposes Edit and Export PDF actions', () => {
    const onEdit = jest.fn();
    const onExport = jest.fn();
    render(<PassportView profile={filled} onEdit={onEdit} onExport={onExport} />);
    fireEvent.press(screen.getByRole('button', { name: /edit profile/i }));
    fireEvent.press(screen.getByRole('button', { name: /export pdf/i }));
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onExport).toHaveBeenCalledTimes(1);
  });
});
