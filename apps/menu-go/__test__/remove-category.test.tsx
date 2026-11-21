import '@testing-library/jest-dom';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toast } from 'react-toastify';

import ItemCategory from '../src/components/Categories/item-category';
import RemoveModal from '../src/components/List/remove-modal';

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }) }));
jest.mock('react-toastify', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

describe('ItemCategory remove action', () => {
  test('owned category shows Remove', () => {
    render(<ItemCategory category={{ id: 'c1', name: 'Mains', configRestaurantId: 'r1' }} />);
    expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
  });

  test('global category shows no Remove', () => {
    render(<ItemCategory category={{ id: 'g1', name: 'Drinks', configRestaurantId: null }} />);
    expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
  });
});

describe('RemoveModal', () => {
  afterEach(() => {
    jest.clearAllMocks();
    // @ts-expect-error test cleanup
    delete global.fetch;
  });

  function mockFetch(status: number, body: unknown) {
    global.fetch = jest.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    }) as jest.Mock;
  }

  test('shows the API conflict message when a category still has dishes', async () => {
    const message = 'Category still has dishes. Move or delete them first.';
    mockFetch(409, { error: message });
    render(<RemoveModal open setOpen={jest.fn()} idType="c1" type="category" />);
    fireEvent.click(screen.getByRole('button', { name: /Remove →/ }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(message));
    expect(global.fetch).toHaveBeenCalledWith('/api/category/c1', { method: 'DELETE' });
  });

  test('confirms a removed dish', async () => {
    mockFetch(200, { id: 'd1' });
    render(<RemoveModal open setOpen={jest.fn()} idType="d1" type="dish" />);
    fireEvent.click(screen.getByRole('button', { name: /Remove →/ }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Dish removed'));
    expect(global.fetch).toHaveBeenCalledWith('/api/dishes/d1', { method: 'DELETE' });
  });
});
