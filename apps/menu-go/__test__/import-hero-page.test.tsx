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
    expect(screen.getByText('Add your dishes')).toBeInTheDocument();
  });

  it('renders the subtitle about fastest way', () => {
    render(<ImportHeroPage userId="user-1" />);
    expect(screen.getByText(/fastest way/i)).toBeInTheDocument();
  });

  it('renders "Add dishes manually" link pointing to /panel/dishes', () => {
    render(<ImportHeroPage userId="user-1" />);
    const link = screen.getByText('Add dishes manually →').closest('a');
    expect(link).toHaveAttribute('href', '/panel/dishes');
  });

  it('does not render the "Import from photo" toggle button (alwaysOpen)', () => {
    render(<ImportHeroPage userId="user-1" />);
    expect(screen.queryByText('Import from photo')).not.toBeInTheDocument();
  });

  it('renders the upload zone directly', () => {
    render(<ImportHeroPage userId="user-1" />);
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
  });
});
