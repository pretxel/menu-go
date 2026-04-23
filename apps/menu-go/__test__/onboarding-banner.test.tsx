/**
 * @jest-environment jsdom
 */
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';

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

  it('renders GET STARTED label', () => {
    render(<OnboardingBanner hasCategory={false} hasDish={false} />);
    expect(screen.getByText('GET STARTED')).toBeInTheDocument();
  });

  it('Profile pill is always shown as done', () => {
    render(<OnboardingBanner hasCategory={false} hasDish={false} />);
    expect(screen.getByText('✓ Profile')).toBeInTheDocument();
  });

  it('Add category pill is active (→) when hasCategory is false', () => {
    render(<OnboardingBanner hasCategory={false} hasDish={false} />);
    expect(screen.getByText('→ Add category')).toBeInTheDocument();
  });

  it('Add category pill is done (✓) when hasCategory is true', () => {
    render(<OnboardingBanner hasCategory={true} hasDish={false} />);
    expect(screen.getByText('✓ Add category')).toBeInTheDocument();
  });

  it('Add dishes pill is active when hasCategory is true and hasDish is false', () => {
    render(<OnboardingBanner hasCategory={true} hasDish={false} />);
    expect(screen.getByText('→ Add dishes')).toBeInTheDocument();
  });

  it('Add dishes pill is done when hasDish is true', () => {
    render(<OnboardingBanner hasCategory={true} hasDish={true} />);
    expect(screen.getByText('✓ Add dishes')).toBeInTheDocument();
  });

  it('Share QR pill is active when all other steps are done', () => {
    render(<OnboardingBanner hasCategory={true} hasDish={true} />);
    expect(screen.getByText('→ Share QR')).toBeInTheDocument();
  });

  it('Add dishes pill links to /panel/onboarding/dishes', () => {
    render(<OnboardingBanner hasCategory={true} hasDish={false} />);
    const link = screen.getByText('→ Add dishes').closest('a');
    expect(link).toHaveAttribute('href', '/panel/onboarding/dishes');
  });

  it('Dismiss button hides banner and sets localStorage flag', () => {
    render(<OnboardingBanner hasCategory={false} hasDish={false} />);
    fireEvent.click(screen.getByText('Dismiss ×'));
    expect(screen.queryByText('GET STARTED')).not.toBeInTheDocument();
    expect(localStorage.getItem('onboarding-dismissed')).toBe('1');
  });

  it('does not render when localStorage flag is set', () => {
    localStorage.setItem('onboarding-dismissed', '1');
    const { container } = render(<OnboardingBanner hasCategory={false} hasDish={false} />);
    expect(container.firstChild).toBeNull();
  });
});
