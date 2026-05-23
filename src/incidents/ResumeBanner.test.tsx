import { describe, it, expect, jest } from '@jest/globals';
import { render, fireEvent, screen } from '@testing-library/react-native';
import { ResumeBanner } from './ResumeBanner';

describe('ResumeBanner', () => {
  it('renders nothing when there are no in-progress incidents', () => {
    const { toJSON } = render(<ResumeBanner count={0} onResume={() => {}} />);
    expect(toJSON()).toBeNull();
  });

  it('shows a clear pluralised label for one or many incidents', () => {
    const { rerender } = render(<ResumeBanner count={1} onResume={() => {}} />);
    expect(screen.getByText(/1 incident in progress/i)).toBeTruthy();
    rerender(<ResumeBanner count={3} onResume={() => {}} />);
    expect(screen.getByText(/3 incidents in progress/i)).toBeTruthy();
  });

  it('Resume button calls onResume', () => {
    const onResume = jest.fn();
    render(<ResumeBanner count={1} onResume={onResume} />);
    fireEvent.press(screen.getByRole('button', { name: /resume/i }));
    expect(onResume).toHaveBeenCalledTimes(1);
  });
});
