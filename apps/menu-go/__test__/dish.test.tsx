// Renders the category name and dishes correctly
import '@testing-library/jest-dom';

import { render, screen } from '@testing-library/react';

import Dishes from '../src/components/Dishes';

const categories = [
  {
    id: 1,
    name: 'Appetizers',
    href: '/panel/dishes/1',
    imageSrc: '/images/categories/appetizers.png',
    imageAlt: 'Appetizers',
  },
  {
    id: 2,
    name: 'Main Course',
    href: '/panel/dishes/2',
    imageSrc: '/images/categories/main.png',
    imageAlt: 'Main Course',
  },
  {
    id: 3,
    name: 'Dessert',
    href: '/panel/dishes/3',
    imageSrc: '/images/categories/dessert.png',
    imageAlt: 'Dessert',
  },
  {
    id: 4,
    name: 'Beverages',
    href: '/panel/dishes/4',
    imageSrc: '/images/categories/drinks.png',
    imageAlt: 'Beverages',
  },
];
describe('Dishes', () => {
  test('should render a grid of product cards with images and names', () => {
    render(<Dishes categories={categories} />);
    const productCards = screen.getAllByRole('button');
    expect(productCards.length).toBe(categories.length);
  });

  test('should display images with correct aspect ratio', () => {
    render(<Dishes categories={categories} />);
    const images = screen.getAllByRole('img');
    images.forEach((image) => {
      expect(image).toHaveAttribute('src', expect.stringContaining('.png'));
      expect(image).toHaveAttribute('alt');
      expect(image).toHaveStyle({ objectFit: 'fill' });
    });
  });
});
