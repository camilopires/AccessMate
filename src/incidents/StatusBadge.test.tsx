import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders a clear label per incident status', () => {
    const { rerender } = render(<StatusBadge status="draft" />);
    expect(screen.getByText(/^draft$/i)).toBeTruthy();
    rerender(<StatusBadge status="in_progress" />);
    expect(screen.getByText(/^in progress$/i)).toBeTruthy();
    rerender(<StatusBadge status="completed" />);
    expect(screen.getByText(/^completed$/i)).toBeTruthy();
  });
});
