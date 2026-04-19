import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

const navigation = [
  { name: 'Tours', path: '/live' },
  { name: 'Shows', path: '/live/shows' },
  { name: 'Venues', path: '/live/venues' },
  { name: 'Calendar', path: '/live/calendar' },
];

export default function Live() {
  const location = useLocation();

  return (
    <div>
      {/* Navigation */}
      <div className="tm-tabs mb-4 md:mb-8">
        {navigation.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/live' && location.pathname.startsWith(item.path));

          return (
            <Link
              key={item.name}
              to={item.path}
              className={`tm-tab${isActive ? ' active folder-active' : ''}`}
            >
              {item.name}
            </Link>
          );
        })}
      </div>

      {/* Sub-page content */}
      <Outlet />
    </div>
  );
}
