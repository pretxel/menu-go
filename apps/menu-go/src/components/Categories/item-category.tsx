import { EllipsisVerticalIcon } from '@heroicons/react/20/solid';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

function generateInitials(name) {
  const [first, second] = name.split(' ');
  if (!second) return first.charAt(0);
  return `${first.charAt(0)}${second?.charAt(0)}`;
}

function generateColor() {
  const colors = [
    'bg-pink-600',
    'bg-purple-600',
    'bg-yellow-500',
    'bg-green-500',
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

export default function ItemCategory({ category }) {
  return (
    <li key={category.name} className="col-span-1 flex rounded-md shadow-sm">
      <div
        className={classNames(
          generateColor(),
          'flex w-16 flex-shrink-0 items-center justify-center rounded-l-md text-sm font-medium text-white'
        )}
      >
        {generateInitials(category.name)}
      </div>
      <div className="flex flex-1 items-center justify-between truncate rounded-r-md border-b border-r border-t border-gray-200 bg-white">
        <div className="flex-1 truncate px-4 py-2 text-sm">
          <a
            href={category.href}
            className="font-medium text-gray-900 hover:text-gray-600"
          >
            {category.name}
          </a>
          <p className="text-gray-500">{category.description} </p>
        </div>
        <div className="flex-shrink-0 pr-2">
          <button
            type="button"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-transparent bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            <span className="sr-only">Open options</span>
            <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </li>
  );
}
