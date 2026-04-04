/**
 * @jest-environment jsdom
 */
import { act, render, screen, fireEvent } from '@testing-library/react';
import PhotoMenuImporter from '../src/components/PhotoMenuImporter';

jest.mock('../src/app/actions', () => ({
  parseMenuFromPhoto: jest.fn(),
  postBulkDishes: jest.fn(),
}));

import { postBulkDishes } from '../src/app/actions';

const parsedCategories = [
  {
    name: 'Starters',
    dishes: [{ name: 'Nachos', description: 'Crispy', price: 8.5, tags: [] }],
  },
];

describe('PhotoMenuImporter — editable preview', () => {
  it('renders name and price inputs after parse', () => {
    const { container } = render(
      <PhotoMenuImporter userId="user-1" initialCategories={parsedCategories} />
    );
    fireEvent.click(screen.getByText('Import from photo'));

    const nameInputs = container.querySelectorAll('input[data-field="name"]');
    const priceInputs = container.querySelectorAll('input[data-field="price"]');

    expect(nameInputs).toHaveLength(1);
    expect(priceInputs).toHaveLength(1);
    expect((nameInputs[0] as HTMLInputElement).value).toBe('Nachos');
    expect((priceInputs[0] as HTMLInputElement).value).toBe('8.5');
  });

  it('editing name updates state before import', async () => {
    render(
      <PhotoMenuImporter userId="user-1" initialCategories={parsedCategories} />
    );
    fireEvent.click(screen.getByText('Import from photo'));

    const nameInput = screen.getByDisplayValue('Nachos');
    fireEvent.change(nameInput, { target: { value: 'Edited Nachos' } });

    const mockPostBulkDishes = postBulkDishes as jest.Mock;
    mockPostBulkDishes.mockResolvedValue(undefined);

    await act(async () => {
      fireEvent.click(screen.getByText('Import all'));
    });

    expect(mockPostBulkDishes).toHaveBeenCalledWith(
      'user-1',
      expect.arrayContaining([
        expect.objectContaining({
          dishes: expect.arrayContaining([
            expect.objectContaining({ name: 'Edited Nachos' }),
          ]),
        }),
      ])
    );
  });

  it('editing price updates state before import', async () => {
    render(
      <PhotoMenuImporter userId="user-1" initialCategories={parsedCategories} />
    );
    fireEvent.click(screen.getByText('Import from photo'));

    const priceInput = screen.getByDisplayValue('8.5');
    fireEvent.change(priceInput, { target: { value: '12.99' } });

    const mockPostBulkDishes = postBulkDishes as jest.Mock;
    mockPostBulkDishes.mockResolvedValue(undefined);

    await act(async () => {
      fireEvent.click(screen.getByText('Import all'));
    });

    expect(mockPostBulkDishes).toHaveBeenCalledWith(
      'user-1',
      expect.arrayContaining([
        expect.objectContaining({
          dishes: expect.arrayContaining([
            expect.objectContaining({ price: 12.99 }),
          ]),
        }),
      ])
    );
  });
});
