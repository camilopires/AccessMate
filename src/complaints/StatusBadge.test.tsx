import { describe, it, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('renders a clear label per status', () => {
    const { rerender } = render(<StatusBadge status="draft" />);
    expect(screen.getByText(/draft/i)).toBeTruthy();
    rerender(<StatusBadge status="sent" />);
    expect(screen.getByText(/sent/i)).toBeTruthy();
    rerender(<StatusBadge status="acknowledged" />);
    expect(screen.getByText(/acknowledged/i)).toBeTruthy();
    rerender(<StatusBadge status="resolved" />);
    expect(screen.getByText(/resolved/i)).toBeTruthy();
    rerender(<StatusBadge status="escalated" />);
    expect(screen.getByText(/escalated/i)).toBeTruthy();
  });
});
