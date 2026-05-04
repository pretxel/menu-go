/* eslint-disable @next/next/no-img-element */
'use client';

import { Disclosure, Menu, Transition } from '@headlessui/react';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function Nav({ navigation, userNavigation }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    const urlSelected = navigation.find((item) => item.href === pathname);
    if (urlSelected) urlSelected.current = true;
  }, [navigation, pathname]);

  useEffect(() => {
    if (status === 'authenticated') {
      if (!session.user.configRestaurantId) {
        const index = navigation.findIndex((item) => item.name === 'Products');
        if (index !== -1) navigation.splice(index, 1);
      } else {
        const index = navigation.findIndex((item) => item.name === 'Products');
        if (index === -1) {
          navigation.push({
            name: 'Products',
            href: '/panel/dishes',
            current: false,
          });
        }
      }
    }
  }, [status, navigation, session]);

  return (
    <Disclosure as="nav" className="border-b-3 border-ink bg-paper">
      {({ open }) => (
        <>
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-8">
              <Link href="/panel" className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center border-3 border-ink bg-tomato text-paper shadow-brut-sm font-display text-lg font-extrabold">
                  D
                </span>
                <span className="font-display text-base font-extrabold tracking-tight">
                  DINEQRS
                </span>
              </Link>
              <div className="hidden gap-2 sm:flex">
                {navigation.map((item) => {
                  const isActive = item.href === pathname;
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      className={classNames(
                        'border-3 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-widest transition-all',
                        isActive
                          ? 'border-ink bg-ink text-paper shadow-brut-sm'
                          : 'border-transparent text-ink/70 hover:border-ink hover:text-ink'
                      )}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {item.name}
                    </a>
                  );
                })}
              </div>
            </div>

            <div className="hidden items-center gap-3 sm:flex">
              {status === 'authenticated' && session?.user?.image && (
                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center gap-2 border-3 border-ink bg-paper p-1 pr-3 shadow-brut-sm transition-all hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut">
                    <img
                      className="h-7 w-7 border-2 border-ink object-cover"
                      src={session.user.image}
                      alt={session.user.name || 'user'}
                    />
                    <span className="hidden font-mono text-xs uppercase tracking-widest md:block">
                      {session.user.name?.split(' ')[0]}
                    </span>
                  </Menu.Button>
                  <Transition
                    enter="transition ease-out duration-150"
                    enterFrom="opacity-0 -translate-y-1"
                    enterTo="opacity-100 translate-y-0"
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Menu.Items className="absolute right-0 z-20 mt-2 w-48 border-3 border-ink bg-paper shadow-brut focus:outline-none">
                      {userNavigation.map((item) => (
                        <Menu.Item key={item.name}>
                          {({ active }) => (
                            <a
                              href={item.href}
                              className={classNames(
                                active ? 'bg-tomato text-paper' : 'text-ink',
                                'block px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-widest'
                              )}
                              onClick={() => item.callback()}
                            >
                              {item.name}
                            </a>
                          )}
                        </Menu.Item>
                      ))}
                    </Menu.Items>
                  </Transition>
                </Menu>
              )}
            </div>

            <div className="flex sm:hidden">
              <Disclosure.Button className="border-3 border-ink bg-paper p-2 shadow-brut-sm">
                {open ? (
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="h-5 w-5" aria-hidden="true" />
                )}
              </Disclosure.Button>
            </div>
          </div>

          <Disclosure.Panel className="border-t-3 border-ink bg-bone sm:hidden">
            <div className="space-y-1 px-4 py-3">
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as="a"
                  href={item.href}
                  className="block border-3 border-ink bg-paper px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest"
                >
                  {item.name}
                </Disclosure.Button>
              ))}
              {userNavigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as="a"
                  href={item.href}
                  className="block border-3 border-ink bg-tomato px-3 py-2 font-mono text-xs font-bold uppercase tracking-widest text-paper"
                  onClick={() => item.callback()}
                >
                  {item.name}
                </Disclosure.Button>
              ))}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  );
}
