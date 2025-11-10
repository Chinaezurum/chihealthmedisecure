import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from './Button.tsx';

describe('Button component', () => {
  it('renders children correctly', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    
    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled when isLoading is true', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();
    render(<Button isLoading={true} onClick={handleClick}>Loading</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    // Try clicking the disabled button
    await user.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('shows a loading spinner when isLoading is true', () => {
    render(<Button isLoading={true}>Loading</Button>);
    // The spinner is an SVG, let's check for its presence.
    const button = screen.getByRole('button');
    const svgElement = button.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
    
    // The text should be visually hidden
    const span = screen.getByText('Loading');
    expect(span).toHaveStyle('opacity: 0');
  });

  it('applies fullWidth class when fullWidth prop is true', () => {
    render(<Button fullWidth>Full Width</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-full-width');
  });
});
