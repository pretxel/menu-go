// Renders the category name and dishes correctly
import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';

import Category from '../src/components/Menu/category';

describe('Category', () => {
  test('should render the category name and dishes correctly', () => {
    const category = [
      { id: 1, name: 'Dish 1', image: '/images/dish1.png', price: 10 },
      { id: 2, name: 'Dish 2', image: '/images/dish2.png', price: 15 },
      { id: 3, name: 'Dish 3', image: '/images/dish3.png', price: 20 },
    ];
    const name = 'Category Name';

    // Act
    render(<Category category={category} name={name} />);

    // Assert
    expect(screen.getByText('Dish 1')).toBeInTheDocument();
    expect(screen.getByText('Dish 2')).toBeInTheDocument();
    expect(screen.getByText('Dish 3')).toBeInTheDocument();
    expect(screen.getByAltText('Dish 1')).toBeInTheDocument();
    expect(screen.getByAltText('Dish 2')).toBeInTheDocument();
    expect(screen.getByAltText('Dish 3')).toBeInTheDocument();
    expect(screen.getByText('$10')).toBeInTheDocument();
    expect(screen.getByText('$15')).toBeInTheDocument();
    expect(screen.getByText('$20')).toBeInTheDocument();
  });

  test('should display each dish with its name, image, and price', () => {
    // Arrange
    const category = [
      { id: 1, name: 'Dish 1', image: '/images/dish1.png', price: 10 },
      { id: 2, name: 'Dish 2', image: '/images/dish2.png', price: 15 },
      { id: 3, name: 'Dish 3', image: '/images/dish3.png', price: 20 },
    ];
    const name = 'Category Name';

    // Act
    render(<Category category={category} name={name} />);

    // Assert
    category.forEach((dish) => {
      expect(screen.getByText(dish.name)).toBeInTheDocument();
      expect(screen.getByAltText(dish.name)).toBeInTheDocument();
      expect(screen.getByText(`$${dish.price}`)).toBeInTheDocument();
    });
  });
});
