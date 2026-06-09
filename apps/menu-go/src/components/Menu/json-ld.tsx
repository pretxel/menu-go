type DishLite = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: { id: string; name: string };
};

type RestaurantLite = {
  name: string | null;
  address: string | null;
  phone: string | null;
  cuisineType: string | null;
  slug: string | null;
  id: string;
};

type Props = {
  restaurant: RestaurantLite;
  dishes: DishLite[];
  url: string;
};

export default function MenuJsonLd({ restaurant, dishes, url }: Props) {
  const grouped = dishes.reduce<Record<string, DishLite[]>>((acc, d) => {
    const key = d.category.name;
    (acc[key] ||= []).push(d);
    return acc;
  }, {});

  const sections = Object.entries(grouped).map(([name, items]) => ({
    '@type': 'MenuSection',
    name,
    hasMenuItem: items.map((d) => ({
      '@type': 'MenuItem',
      name: d.name,
      description: d.description ?? undefined,
      offers: { '@type': 'Offer', price: d.price, priceCurrency: 'USD' },
    })),
  }));

  const data = {
    '@context': 'https://schema.org',
    '@type': 'Restaurant',
    name: restaurant.name || undefined,
    address: restaurant.address || undefined,
    telephone: restaurant.phone || undefined,
    servesCuisine: restaurant.cuisineType || undefined,
    url,
    hasMenu: { '@type': 'Menu', hasMenuSection: sections },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
