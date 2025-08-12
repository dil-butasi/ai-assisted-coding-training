import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Toast } from '../components/Toast/Toast';

describe('Toast Component', () => {
  it('should render toast when open is true', () => {
    const mockOnClose = vi.fn();

    render(<Toast open={true} message="Test message" severity="info" onClose={mockOnClose} />);

    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('should not render toast when open is false', () => {
    const mockOnClose = vi.fn();

    render(<Toast open={false} message="Test message" severity="info" onClose={mockOnClose} />);

    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('should call onClose when close button is clicked', () => {
    const mockOnClose = vi.fn();

    render(<Toast open={true} message="Test message" severity="error" onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should display different severity levels correctly', () => {
    const mockOnClose = vi.fn();

    const { rerender } = render(
      <Toast open={true} message="Warning message" severity="warning" onClose={mockOnClose} />
    );

    expect(screen.getByText('Warning message')).toBeInTheDocument();

    rerender(<Toast open={true} message="Error message" severity="error" onClose={mockOnClose} />);

    expect(screen.getByText('Error message')).toBeInTheDocument();

    rerender(
      <Toast open={true} message="Success message" severity="success" onClose={mockOnClose} />
    );

    expect(screen.getByText('Success message')).toBeInTheDocument();
  });

  it('should auto-hide after specified duration', async () => {
    const mockOnClose = vi.fn();

    render(
      <Toast
        open={true}
        message="Auto-hide message"
        severity="info"
        autoHideDuration={100}
        onClose={mockOnClose}
      />
    );

    await waitFor(
      () => {
        expect(mockOnClose).toHaveBeenCalled();
      },
      { timeout: 200 }
    );
  });
});
