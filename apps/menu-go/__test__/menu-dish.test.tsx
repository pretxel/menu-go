import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';

import Dish from '../src/components/Menu/dish';

describe('Menu Dish Component', () => {
  const baseDish = {
    id: 'd1',
    name: 'Margherita Pizza',
    price: 12.99,
    description: 'Classic tomato and mozzarella',
    image: '/images/pizza.png',
    tags: [],
    isAvailable: true,
  };

  test('renders dish name and price', () => {
    render(<Dish dish={baseDish} />);

    expect(screen.getByText('Margherita Pizza')).toBeInTheDocument();
    expect(screen.getByText('$12.99')).toBeInTheDocument();
  });

  test('renders dish description', () => {
    render(<Dish dish={baseDish} />);

    expect(screen.getByText('Classic tomato and mozzarella')).toBeInTheDocument();
  });

  test('renders image when provided', () => {
    render(<Dish dish={baseDish} />);

    const img = screen.getByAltText('Margherita Pizza');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src');
  });

  test('renders placeholder when no image', () => {
    const dishNoImage = { ...baseDish, image: null };
    render(<Dish dish={dishNoImage} />);

    // No img element with dish alt text
    expect(screen.queryByAltText('Margherita Pizza')).not.toBeInTheDocument();
    // Placeholder emoji should be present
    expect(screen.getByText('🍽️')).toBeInTheDocument();
  });

  test('does not render description when empty', () => {
    const dishNoDesc = { ...baseDish, description: null };
    render(<Dish dish={dishNoDesc} />);

    expect(screen.queryByText('Classic tomato and mozzarella')).not.toBeInTheDocument();
  });

  test('renders dietary tags', () => {
    const dishWithTags = { ...baseDish, tags: ['vegan', 'spicy', 'gluten-free'] };
    render(<Dish dish={dishWithTags} />);

    expect(screen.getByText('Vegan')).toBeInTheDocument();
    expect(screen.getByText('Spicy')).toBeInTheDocument();
    expect(screen.getByText('Gluten-Free')).toBeInTheDocument();
  });

  test('renders vegetarian and dairy-free tags', () => {
    const dishWithTags = { ...baseDish, tags: ['vegetarian', 'dairy-free'] };
    render(<Dish dish={dishWithTags} />);

    expect(screen.getByText('Vegetarian')).toBeInTheDocument();
    expect(screen.getByText('Dairy-Free')).toBeInTheDocument();
  });

  test('does not render tags section when tags array is empty', () => {
    render(<Dish dish={baseDish} />);

    expect(screen.queryByText('Vegan')).not.toBeInTheDocument();
    expect(screen.queryByText('Spicy')).not.toBeInTheDocument();
  });

  test('handles unknown tags gracefully', () => {
    const dishWithUnknownTag = { ...baseDish, tags: ['organic'] };
    render(<Dish dish={dishWithUnknownTag} />);

    // Unknown tags are rendered with the raw tag string
    expect(screen.getByText('organic')).toBeInTheDocument();
  });

  test('formats price with two decimal places', () => {
    const dishRoundPrice = { ...baseDish, price: 10 };
    render(<Dish dish={dishRoundPrice} />);

    expect(screen.getByText('$10.00')).toBeInTheDocument();
  });
});
