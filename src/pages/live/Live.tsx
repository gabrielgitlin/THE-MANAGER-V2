import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

const navigation = [
  { name: 'Overview', path: '/live' },
  { name: 'Logistics', path: '/live/logistics' },
  { name: 'Marketing', path: '/live/marketing' },
  { name: 'Production', path: '/live/production' },
];

export default function Live() {
  const location = useLocation();

  return (
    <div>
      <div className="mb-4 md:mb-8">
        <h1 className="text-xl md:text-2xl font-bold text-charcoal font-title">LIVE EVENTS</h1>
        <p className="mt-0.5 md:mt-1 text-sm text-gray-500">
          Manage tours, shows, and live performances
        </p>
      </div>

      {/* Navigation */}
      <div className="mb-4 md:mb-8 scroll-row">
        <div className="inline-flex rounded-full border-2 border-black p-1 bg-white">
          <nav className="flex gap-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.path ||
                (item.path !== '/live' && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`
                    px-4 md:px-6 py-2 text-sm font-medium uppercase rounded-full transition-colors whitespace-nowrap
                    ${isActive
                      ? 'text-blue-600'
                      : 'text-black hover:text-blue-600'
                    }
                  `}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Sub-page content */}
      <Outlet />
    </div>
  );
}