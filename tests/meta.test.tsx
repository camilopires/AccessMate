import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

describe('jest + RNTL', () => {
  it('renders RN components', () => {
    render(<Text>hello</Text>);
    expect(screen.getByText('hello')).toBeTruthy();
  });
});
