/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';

import ImportHeroPage from '../src/components/PhotoMenuImporter/import-hero-page';

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

jest.mock('next/link', () => {
  return function MockLink({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  };
});

jest.mock('../src/app/actions', () => ({
  parseMenuFromPhoto: jest.fn(),
  postBulkDishes: jest.fn(),
}));

describe('ImportHeroPage', () => {
  it('renders the page heading', () => {
    render(<ImportHeroPage userId="user-1" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/paper menu/i);
  });

  it('renders the subtitle about extracting dishes', () => {
    render(<ImportHeroPage userId="user-1" />);
    expect(screen.getByText(/every dish/i)).toBeInTheDocument();
  });

  it('renders "Add dishes manually" link pointing to /panel/dishes', () => {
    render(<ImportHeroPage userId="user-1" />);
    const link = screen.getByText(/add dishes manually/i).closest('a');
    expect(link).toHaveAttribute('href', '/panel/dishes');
  });

  it('does not render the "Import from photo" toggle button (alwaysOpen)', () => {
    render(<ImportHeroPage userId="user-1" />);
    expect(screen.queryByText(/import from photo/i)).not.toBeInTheDocument();
  });

  it('renders the upload zone directly', () => {
    render(<ImportHeroPage userId="user-1" />);
    expect(screen.getByText(/drop menu photo/i)).toBeInTheDocument();
  });
});
