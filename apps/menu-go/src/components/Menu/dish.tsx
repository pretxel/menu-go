import Image from 'next/image';

const TAG_LABELS: Record<string, { label: string; color: string }> = {
  vegan: { label: 'Vegan', color: 'bg-green-100 text-green-800' },
  vegetarian: { label: 'Vegetarian', color: 'bg-lime-100 text-lime-800' },
  spicy: { label: 'Spicy', color: 'bg-red-100 text-red-800' },
  'gluten-free': { label: 'Gluten-Free', color: 'bg-yellow-100 text-yellow-800' },
  'dairy-free': { label: 'Dairy-Free', color: 'bg-blue-100 text-blue-800' },
};

export default function Dish({ dish }) {
  const tags: string[] = dish.tags || [];

  return (
    <div className="group flex flex-col bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
      <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden bg-gray-100">
        {dish.image ? (
          <Image
            src={dish.image}
            width={400}
            height={300}
            alt={dish.name}
            className="h-48 w-full object-cover object-center group-hover:opacity-90 transition-opacity"
          />
        ) : (
          <div className="h-48 w-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
            <span className="text-4xl">🍽️</span>
          </div>
        )}
      </div>
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold text-gray-900 leading-tight">{dish.name}</h3>
          <span
            className="text-base font-bold whitespace-nowrap"
            style={{ color: 'var(--color-primary, #4F46E5)' }}
          >
            ${dish.price?.toFixed(2)}
          </span>
        </div>
        {dish.description && (
          <p className="mt-1 text-sm text-gray-500 leading-relaxed line-clamp-2">{dish.description}</p>
        )}
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((tag) => {
              const tagInfo = TAG_LABELS[tag] || { label: tag, color: 'bg-gray-100 text-gray-700' };
              return (
                <span key={tag} className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${tagInfo.color}`}>
                  {tagInfo.label}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
