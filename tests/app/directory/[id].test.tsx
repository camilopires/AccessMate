import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { Linking } from 'react-native';
import OperatorDetail from '../../../app/directory/[id]';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'avanti-west-coast' }),
}));

describe('OperatorDetail', () => {
  beforeEach(() => {
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
  });

  it('renders the operator name', () => {
    render(<OperatorDetail />);
    expect(screen.getByText('Avanti West Coast')).toBeTruthy();
  });

  it('opens a tel: URL when assistance call is tapped', () => {
    render(<OperatorDetail />);
    fireEvent.press(screen.getByRole('button', { name: /call passenger assistance/i }));
    expect(Linking.openURL).toHaveBeenCalledWith('tel:+44-3457-225225');
  });
});
