import React from 'react';
import { cn } from '../../lib/utils';

/* ── Primary Tabs (underline style) ── */

interface Tab {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TMTabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export function TMTabs({ tabs, activeTab, onChange, size = 'md', className }: TMTabsProps) {
  const isSmall = size === 'sm';

  return (
    <div className={cn(isSmall ? 'sub-tabs' : 'tm-tabs', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={cn(
            isSmall ? 'sub-tab' : 'tm-tab',
            activeTab === tab.id && (isSmall ? 'active' : 'active folder-active')
          )}
          onClick={() => onChange(tab.id)}
        >
          {tab.icon && <span className="mr-1.5">{tab.icon}</span>}
          {tab.label}
          {tab.count !== undefined && (
            <span
              style={{
                marginLeft: 6,
                fontSize: isSmall ? 9 : 10,
                color: activeTab === tab.id ? 'var(--brand-1)' : 'var(--t3)',
                opacity: 0.7,
              }}
            >
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ── Tab panel container ── */
interface TMTabPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  active: boolean;
}

export function TMTabPanel({ active, className, children, ...props }: TMTabPanelProps) {
  if (!active) return null;
  return (
    <div className={cn('animate-fade-in', className)} {...props}>
      {children}
    </div>
  );
}
