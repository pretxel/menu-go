import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';

import DishesForm from '../src/components/Forms/dishesForm';

// Mock react-dom — useFormState is aliased to useActionState in newer React
jest.mock('react-dom', () => {
  const actual = jest.requireActual('react-dom');
  const mockFormHook = jest.fn(() => [{ message: null }, jest.fn()]);
  return {
    ...actual,
    useFormState: mockFormHook,
    useActionState: mockFormHook,
  };
});

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: { success: jest.fn() },
}));

// Mock the Uploader component
jest.mock('../src/components/Uploader', () => {
  return function MockUploader() {
    return <div data-testid="uploader">Uploader</div>;
  };
});

// Mock the UserNoAuth component
jest.mock('../src/components/Menu/user-no-auth', () => {
  return function MockUserNoAuth() {
    return null;
  };
});

// Mock the Alerts component
jest.mock('../src/components/Alerts', () => {
  return function MockAlerts() {
    return null;
  };
});

// Mock the postDish server action
jest.mock('../src/app/actions', () => ({
  postDish: jest.fn(),
}));

describe('DishesForm Component', () => {
  const defaultProps = {
    userId: 'user-123',
    categoryId: 'cat-1',
    category: { name: 'Appetizers', description: 'Starters and small plates' },
  };

  test('renders category name and description', () => {
    render(<DishesForm {...defaultProps} />);

    expect(screen.getByText('Appetizers')).toBeInTheDocument();
    expect(screen.getByText('Starters and small plates')).toBeInTheDocument();
  });

  test('renders name input field', () => {
    render(<DishesForm {...defaultProps} />);

    const nameInput = screen.getByLabelText('Name');
    expect(nameInput).toBeInTheDocument();
    expect(nameInput).toHaveAttribute('name', 'name');
    expect(nameInput).toBeRequired();
  });

  test('renders price input field', () => {
    render(<DishesForm {...defaultProps} />);

    // The label htmlFor="name" is reused, so use the input's id directly
    const priceInput = document.getElementById('price') as HTMLInputElement;
    expect(priceInput).toBeInTheDocument();
    expect(priceInput).toHaveAttribute('name', 'price');
    expect(priceInput).toBeRequired();
  });

  test('renders description textarea', () => {
    render(<DishesForm {...defaultProps} />);

    // The label htmlFor="name" is reused, so use the textarea's id directly
    const descInput = document.getElementById('description') as HTMLTextAreaElement;
    expect(descInput).toBeInTheDocument();
    expect(descInput).toHaveAttribute('name', 'description');
    expect(descInput).toBeRequired();
  });

  test('renders Save and Cancel buttons', () => {
    render(<DishesForm {...defaultProps} />);

    expect(screen.getByText('Save')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  test('renders hidden fields for categoryId and userId', () => {
    render(<DishesForm {...defaultProps} />);

    const categoryInput = document.getElementById('categoryId') as HTMLInputElement;
    expect(categoryInput).toBeInTheDocument();
    expect(categoryInput).toHaveAttribute('type', 'hidden');
    expect(categoryInput).toHaveValue('cat-1');

    const userInput = document.getElementById('userId') as HTMLInputElement;
    expect(userInput).toBeInTheDocument();
    expect(userInput).toHaveAttribute('type', 'hidden');
  });

  test('populates fields when editing an existing dish', () => {
    const dish = {
      id: 'dish-1',
      name: 'Caesar Salad',
      price: 9.5,
      description: 'Romaine lettuce with caesar dressing',
      categoryId: 'cat-1',
      category: { id: 'cat-1', name: 'Appetizers' },
    };

    render(<DishesForm {...defaultProps} dish={dish} />);

    expect(screen.getByDisplayValue('Caesar Salad')).toBeInTheDocument();
    expect(screen.getByDisplayValue('9.5')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Romaine lettuce with caesar dressing')).toBeInTheDocument();
  });

  test('renders Uploader when dish is provided', () => {
    const dish = {
      id: 'dish-1',
      name: 'Caesar Salad',
      price: 9.5,
      description: 'A salad',
      categoryId: 'cat-1',
      category: { id: 'cat-1', name: 'Appetizers' },
    };

    render(<DishesForm {...defaultProps} dish={dish} />);

    expect(screen.getByTestId('uploader')).toBeInTheDocument();
  });

  test('does not render Uploader when creating a new dish', () => {
    render(<DishesForm {...defaultProps} />);

    expect(screen.queryByTestId('uploader')).not.toBeInTheDocument();
  });
});
