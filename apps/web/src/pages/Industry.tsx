import React, { useState } from 'react';
import PeopleTab from '../components/industry/PeopleTab';
import CompaniesTab from '../components/industry/CompaniesTab';
import ProjectsTab from '../components/industry/ProjectsTab';

type TopTab = 'people' | 'companies' | 'projects';

const TAB_LABELS: Record<TopTab, string> = {
  people: 'People',
  companies: 'Companies',
  projects: 'Projects',
};

export default function Industry() {
  const [tab, setTab] = useState<TopTab>('people');

  return (
    <div className="p-4 md:p-6 space-y-[28px]">
      <div className="tm-tabs">
        {(Object.keys(TAB_LABELS) as TopTab[]).map(t => (
          <button
            key={t}
            className={`tm-tab${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >
            {TAB_LABELS[t]}
          </button>
        ))}
      </div>

      {tab === 'people' && <PeopleTab />}
      {tab === 'companies' && <CompaniesTab />}
      {tab === 'projects' && <ProjectsTab />}
    </div>
  );
}
