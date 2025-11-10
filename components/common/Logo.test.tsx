import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Logo } from './Logo.tsx';

describe('Logo component', () => {
  it('renders the SVG logo', () => {
    const { container } = render(<Logo />);
    const svgElement = container.querySelector('svg');
    expect(svgElement).toBeInTheDocument();
  });

  it('contains the correct paths for the "C" and plus shapes', () => {
    const { container } = render(<Logo />);
    const paths = container.querySelectorAll('path');
    expect(paths.length).toBe(2);
    expect(paths[0]).toHaveAttribute('stroke', 'url(#logo-gradient)');
    expect(paths[1]).toHaveAttribute('d', 'M12 9V15M9 12H15');
  });
});
