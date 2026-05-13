import { render } from '@testing-library/react';
import MenuJsonLd from '../src/components/Menu/json-ld';

describe('MenuJsonLd', () => {
  it('emits Restaurant schema with menu sections grouped by category', () => {
    const { container } = render(
      <MenuJsonLd
        url="https://www.dineqrs.com/r/joes"
        restaurant={{
          name: "Joe's",
          address: '1 Main',
          phone: '555',
          cuisineType: 'Pizza',
          slug: 'joes',
          id: 'r1',
        }}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        dishes={[
          { id: 'd1', name: 'Margherita', description: 'classic', price: 12, category: { id: 'c1', name: 'Pizza' } } as any,
          { id: 'd2', name: 'Pepperoni', description: 'spicy', price: 14, category: { id: 'c1', name: 'Pizza' } } as any,
          { id: 'd3', name: 'Tiramisu', description: 'cream', price: 7, category: { id: 'c2', name: 'Dessert' } } as any,
        ]}
      />,
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeTruthy();
    const data = JSON.parse(script!.textContent!);
    expect(data['@type']).toBe('Restaurant');
    expect(data.name).toBe("Joe's");
    expect(data.address).toBe('1 Main');
    expect(data.servesCuisine).toBe('Pizza');
    expect(data.url).toBe('https://www.dineqrs.com/r/joes');
    expect(data.hasMenu['@type']).toBe('Menu');
    expect(data.hasMenu.hasMenuSection).toHaveLength(2);
    const pizzaSection = data.hasMenu.hasMenuSection.find((s: { name: string }) => s.name === 'Pizza');
    expect(pizzaSection.hasMenuItem).toHaveLength(2);
    expect(pizzaSection.hasMenuItem[0]).toMatchObject({
      '@type': 'MenuItem',
      name: 'Margherita',
      description: 'classic',
      offers: { '@type': 'Offer', price: 12, priceCurrency: 'USD' },
    });
  });

  it('omits optional fields when null', () => {
    const { container } = render(
      <MenuJsonLd
        url="https://x.test/r/y"
        restaurant={{
          name: null,
          address: null,
          phone: null,
          cuisineType: null,
          slug: null,
          id: 'r2',
        }}
        dishes={[]}
      />,
    );
    const data = JSON.parse(container.querySelector('script')!.textContent!);
    expect(data.address).toBeUndefined();
    expect(data.servesCuisine).toBeUndefined();
    expect(data.telephone).toBeUndefined();
    expect(data.hasMenu.hasMenuSection).toHaveLength(0);
  });
});
