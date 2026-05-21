import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import DirectoryScreen from '../../../app/directory/index';

describe('DirectoryScreen', () => {
  it('lists bundled operators', () => {
    render(<DirectoryScreen />);
    expect(screen.getByText('Avanti West Coast')).toBeTruthy();
  });
});
