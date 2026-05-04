/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';

import OnboardingBanner from '../src/components/OnboardingBanner';

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

describe('OnboardingBanner', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the get-started header', () => {
    render(<OnboardingBanner hasCategory={false} hasDish={false} />);
    expect(screen.getByText(/get started/i)).toBeInTheDocument();
  });

  it('Profile step is always shown as done', () => {
    render(<OnboardingBanner hasCategory={false} hasDish={false} />);
    const profileItem = screen.getByText('Profile').closest('li');
    expect(profileItem).toHaveTextContent(/done/i);
  });

  it('Category step is active when hasCategory is false', () => {
    render(<OnboardingBanner hasCategory={false} hasDish={false} />);
    const item = screen.getByText('Category').closest('li');
    expect(item).toHaveTextContent(/now/i);
  });

  it('Category step is done when hasCategory is true', () => {
    render(<OnboardingBanner hasCategory={true} hasDish={false} />);
    const item = screen.getByText('Category').closest('li');
    expect(item).toHaveTextContent(/done/i);
  });

  it('Dishes step is active when hasCategory is true and hasDish is false', () => {
    render(<OnboardingBanner hasCategory={true} hasDish={false} />);
    const item = screen.getByText('Dishes').closest('li');
    expect(item).toHaveTextContent(/now/i);
  });

  it('Dishes step is done when hasDish is true', () => {
    render(<OnboardingBanner hasCategory={true} hasDish={true} />);
    const item = screen.getByText('Dishes').closest('li');
    expect(item).toHaveTextContent(/done/i);
  });

  it('Share QR step is active when all other steps are done', () => {
    render(<OnboardingBanner hasCategory={true} hasDish={true} />);
    const item = screen.getByText('Share QR').closest('li');
    expect(item).toHaveTextContent(/now/i);
  });

  it('Dishes step links to /panel/onboarding/dishes', () => {
    render(<OnboardingBanner hasCategory={true} hasDish={false} />);
    const link = screen.getByText('Dishes').closest('a');
    expect(link).toHaveAttribute('href', '/panel/onboarding/dishes');
  });

  it('Dismiss button hides banner and sets localStorage flag', () => {
    render(<OnboardingBanner hasCategory={false} hasDish={false} />);
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
    expect(screen.queryByText(/get started/i)).not.toBeInTheDocument();
    expect(localStorage.getItem('onboarding-dismissed')).toBe('1');
  });

  it('does not render when localStorage flag is set', () => {
    localStorage.setItem('onboarding-dismissed', '1');
    const { container } = render(<OnboardingBanner hasCategory={false} hasDish={false} />);
    expect(container.firstChild).toBeNull();
  });
});
