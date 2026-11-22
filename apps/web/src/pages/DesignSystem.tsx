import { useState } from 'react';
import { Plus, Edit3, Trash2, MoreVertical, Download, Copy, Search } from 'lucide-react';
import {
  Button,
  TMCard, TMCardHeader, TMCardBody, TMCardFooter,
  TMTabs, TMTabPanel,
  DataTable,
  EmptyState,
  FormField,
  Badge,
  Dropdown,
} from '../components/ui';
import type { Column } from '../components/ui';

/* ── Sample data ── */
const sampleTracks = [
  { title: 'Amanecer', album: 'Luna Nueva', streams: '1,234,567', revenue: '$3,210', isrc: 'USXX12345' },
  { title: 'Noche Eterna', album: 'Luna Nueva', streams: '890,432', revenue: '$2,140', isrc: 'USXX12346' },
  { title: 'Fuego', album: 'Cenizas', streams: '456,789', revenue: '$1,120', isrc: 'USXX12347' },
  { title: 'Silencio', album: 'Cenizas', streams: '321,098', revenue: '$810', isrc: 'USXX12348' },
  { title: 'Estrellas', album: 'Cosmos', streams: '278,654', revenue: '$690', isrc: 'USXX12349' },
];

const trackColumns: Column<typeof sampleTracks[0]>[] = [
  { key: 'title', header: 'Track', render: (r) => <span style={{ color: 'var(--t1)', fontWeight: 500 }}>{r.title}</span> },
  { key: 'album', header: 'Album' },
  { key: 'streams', header: 'Streams', align: 'right' },
  { key: 'revenue', header: 'Revenue', align: 'right', render: (r) => <span className="text-brand">{r.revenue}</span> },
  { key: 'isrc', header: 'ISRC' },
];

const tabItems = [
  { id: 'overview', label: 'Overview' },
  { id: 'tracks', label: 'Tracks', count: 24 },
  { id: 'albums', label: 'Albums', count: 3 },
  { id: 'analytics', label: 'Analytics' },
];

const subTabItems = [
  { id: 'all', label: 'All' },
  { id: 'released', label: 'Released' },
  { id: 'drafts', label: 'Drafts' },
  { id: 'archived', label: 'Archived' },
];

export default function DesignSystem() {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeSubTab, setActiveSubTab] = useState('all');
  const [inputVal, setInputVal] = useState('');

  return (
    <div className="space-y-10">

      {/* ── HEADER ── */}
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--t1)', marginBottom: 4 }}>
          Design System
        </h1>
        <p style={{ color: 'var(--t3)', fontSize: 13 }}>
          The Manager — Component reference &amp; token documentation
        </p>
      </div>


      {/* ════════════════════ COLORS ════════════════════ */}
      <Section title="COLORS">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Swatch color="#0c0c0c" label="bg" border />
          <Swatch color="#141414" label="surface" border />
          <Swatch color="#1a1a1a" label="surface-2" border />
          <Swatch color="#222222" label="surface-3" border />
          <Swatch color="#2a2a2a" label="surface-4" border />
          <Swatch color="#ffffff" label="t1" dark />
          <Swatch color="#cccccc" label="t2" dark />
          <Swatch color="#999999" label="t3" dark />
          <Swatch color="#009C55" label="brand-1" />
          <Swatch color="#007A43" label="brand-2" />
          <Swatch color="#005C32" label="brand-3" />
          <Swatch color="#DDAA44" label="status-yellow" />
          <Swatch color="#E08A3C" label="status-orange" />
          <Swatch color="#DD5555" label="status-red" />
        </div>
      </Section>


      {/* ════════════════════ TYPOGRAPHY ════════════════════ */}
      <Section title="TYPOGRAPHY">
        <TMCard padded>
          <div className="space-y-5">
            <div>
              <span className="text-t3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>KPI / 24px light</span>
              <div style={{ fontSize: 24, fontWeight: 300, color: 'var(--t1)', marginTop: 4 }}>$124,500.00</div>
            </div>
            <div className="tm-divider" />
            <div>
              <span className="text-t3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>H1 / 18px semibold</span>
              <h1 style={{ marginTop: 4 }}>Dashboard Overview</h1>
            </div>
            <div>
              <span className="text-t3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>H2 / 15px semibold</span>
              <h2 style={{ marginTop: 4 }}>Revenue Breakdown</h2>
            </div>
            <div>
              <span className="text-t3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>H3 / 14px medium</span>
              <h3 style={{ marginTop: 4 }}>Streaming Platforms</h3>
            </div>
            <div>
              <span className="text-t3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Body / 14px regular</span>
              <p style={{ marginTop: 4 }}>Track performance across all major streaming platforms and territories.</p>
            </div>
            <div>
              <span className="text-t3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Data / 13px regular</span>
              <p style={{ marginTop: 4, fontSize: 13 }}>1,234,567 streams &middot; $3,210.45 revenue &middot; 12 territories</p>
            </div>
            <div>
              <span className="text-t3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Section title / 11px uppercase</span>
              <div className="section-title" style={{ marginTop: 4, marginBottom: 0 }}>Latest Releases</div>
            </div>
            <div>
              <span className="text-t3" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Label / 10px uppercase</span>
              <label style={{ display: 'block', marginTop: 4 }}>Release Date</label>
            </div>
          </div>
        </TMCard>
      </Section>


      {/* ════════════════════ BUTTONS ════════════════════ */}
      <Section title="BUTTONS">
        <TMCard padded>
          <div className="space-y-6">
            {/* Variants */}
            <div>
              <div className="section-title">Variants</div>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" icon={<Plus size={14} />}>Add Track</Button>
                <Button variant="secondary" icon={<Edit3 size={14} />}>Edit</Button>
                <Button variant="ghost">Cancel</Button>
                <Button variant="danger" icon={<Trash2 size={14} />}>Delete</Button>
              </div>
            </div>

            <div className="tm-divider" />

            {/* Sizes */}
            <div>
              <div className="section-title">Sizes</div>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" size="sm">Small</Button>
                <Button variant="primary" size="md">Medium</Button>
                <Button variant="primary" size="lg">Large</Button>
              </div>
            </div>

            <div className="tm-divider" />

            {/* States */}
            <div>
              <div className="section-title">States</div>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" loading>Saving...</Button>
                <Button variant="primary" disabled>Disabled</Button>
                <Button variant="secondary" disabled>Disabled</Button>
                <Button iconOnly icon={<MoreVertical size={16} />} />
                <Button iconOnly icon={<Search size={16} />} size="sm" />
              </div>
            </div>
          </div>
        </TMCard>
      </Section>


      {/* ════════════════════ CARDS ════════════════════ */}
      <Section title="CARDS & CONTAINERS">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card with header */}
          <TMCard>
            <TMCardHeader title="Monthly Revenue" subtitle="Jan 2026" action={<Button variant="ghost" size="sm">View All</Button>} />
            <TMCardBody>
              <div style={{ fontSize: 24, fontWeight: 300, color: 'var(--t1)' }}>$24,500</div>
              <div style={{ fontSize: 12, color: 'var(--status-green)', marginTop: 4 }}>+12.5% vs last month</div>
            </TMCardBody>
          </TMCard>

          {/* Padded card */}
          <TMCard padded>
            <div className="section-title">Padded Card</div>
            <p style={{ fontSize: 13, color: 'var(--t2)' }}>
              This card uses the <code style={{ color: 'var(--brand-1)' }}>padded</code> variant — uniform padding on all sides, no header/body separation.
            </p>
          </TMCard>

          {/* Card with footer */}
          <TMCard>
            <TMCardHeader title="Quick Action" />
            <TMCardBody>
              <p style={{ fontSize: 13, color: 'var(--t2)' }}>Card with a footer for action buttons.</p>
            </TMCardBody>
            <TMCardFooter>
              <Button variant="ghost" size="sm">Cancel</Button>
              <Button variant="primary" size="sm">Save</Button>
            </TMCardFooter>
          </TMCard>

          {/* Metric grid */}
          <div>
            <div className="section-title" style={{ marginBottom: 8 }}>Metric Grid</div>
            <div className="metric-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
              <div className="metric-card">
                <div className="val">1.2M</div>
                <div className="lbl">Total Streams</div>
              </div>
              <div className="metric-card">
                <div className="val">$3.2K</div>
                <div className="lbl">Revenue</div>
              </div>
              <div className="metric-card">
                <div className="val">24</div>
                <div className="lbl">Tracks</div>
              </div>
              <div className="metric-card">
                <div className="val">12</div>
                <div className="lbl">Territories</div>
              </div>
            </div>
          </div>
        </div>
      </Section>


      {/* ════════════════════ TABS ════════════════════ */}
      <Section title="TABS">
        <TMCard>
          <div style={{ padding: '0 20px' }}>
            <TMTabs tabs={tabItems} activeTab={activeTab} onChange={setActiveTab} />
          </div>
          <div style={{ padding: '0 20px', marginTop: -1 }}>
            <TMTabs tabs={subTabItems} activeTab={activeSubTab} onChange={setActiveSubTab} size="sm" />
          </div>
          <TMCardBody>
            <TMTabPanel active={activeTab === 'overview'}>
              <p style={{ fontSize: 13, color: 'var(--t2)' }}>Overview content goes here. Primary tabs are 12px uppercase with green underline. Sub-tabs are 11px, slightly smaller.</p>
            </TMTabPanel>
            <TMTabPanel active={activeTab === 'tracks'}>
              <p style={{ fontSize: 13, color: 'var(--t2)' }}>Tracks listing would go here.</p>
            </TMTabPanel>
            <TMTabPanel active={activeTab === 'albums'}>
              <p style={{ fontSize: 13, color: 'var(--t2)' }}>Albums grid would go here.</p>
            </TMTabPanel>
            <TMTabPanel active={activeTab === 'analytics'}>
              <p style={{ fontSize: 13, color: 'var(--t2)' }}>Analytics dashboard would go here.</p>
            </TMTabPanel>
          </TMCardBody>
        </TMCard>
      </Section>


      {/* ════════════════════ DATA TABLE ════════════════════ */}
      <Section title="DATA TABLE">
        <TMCard>
          <TMCardHeader
            title="Catalog"
            subtitle="5 tracks"
            action={
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" icon={<Download size={14} />}>Export</Button>
                <Button variant="primary" size="sm" icon={<Plus size={14} />}>Add Track</Button>
              </div>
            }
          />
          <DataTable columns={trackColumns} data={sampleTracks} onRowClick={(row) => console.log(row)} />
        </TMCard>
      </Section>


      {/* ════════════════════ BADGES ════════════════════ */}
      <Section title="BADGES & STATUS">
        <TMCard padded>
          <div className="space-y-4">
            <div>
              <div className="section-title">Status Badges</div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="green">Released</Badge>
                <Badge variant="yellow">Pending</Badge>
                <Badge variant="orange">Review</Badge>
                <Badge variant="red">Overdue</Badge>
                <Badge variant="brand">Featured</Badge>
                <Badge variant="neutral">Draft</Badge>
              </div>
            </div>
            <div className="tm-divider" />
            <div>
              <div className="section-title">With Dot</div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="green" dot>Active</Badge>
                <Badge variant="yellow" dot>Warning</Badge>
                <Badge variant="red" dot>Error</Badge>
              </div>
            </div>
            <div className="tm-divider" />
            <div>
              <div className="section-title">Traffic Lights</div>
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2"><span className="tl tl-green" /> Connected</span>
                <span className="flex items-center gap-2"><span className="tl tl-yellow" /> Syncing</span>
                <span className="flex items-center gap-2"><span className="tl tl-orange" /> Delayed</span>
                <span className="flex items-center gap-2"><span className="tl tl-red" /> Offline</span>
              </div>
            </div>
          </div>
        </TMCard>
      </Section>


      {/* ════════════════════ FORMS ════════════════════ */}
      <Section title="FORM INPUTS">
        <TMCard padded>
          <div className="space-y-5">
            <div className="form-row form-row-2">
              <FormField label="Artist Name" required>
                <input type="text" placeholder="Enter artist name" value={inputVal} onChange={(e) => setInputVal(e.target.value)} />
              </FormField>
              <FormField label="Genre">
                <select>
                  <option value="">Select genre</option>
                  <option>Pop</option>
                  <option>Rock</option>
                  <option>Hip-Hop</option>
                  <option>Electronic</option>
                  <option>Latin</option>
                </select>
              </FormField>
            </div>
            <div className="form-row form-row-3">
              <FormField label="Country">
                <input type="text" placeholder="Mexico" />
              </FormField>
              <FormField label="City">
                <input type="text" placeholder="CDMX" />
              </FormField>
              <FormField label="Label">
                <input type="text" placeholder="Independent" />
              </FormField>
            </div>
            <FormField label="Bio" hint="Max 500 characters">
              <textarea placeholder="Brief artist biography..." rows={3} style={{ width: '100%', resize: 'vertical' }} />
            </FormField>
            <FormField label="Website" error="Invalid URL format">
              <input type="url" placeholder="https://" value="not-a-url" readOnly style={{ borderColor: 'var(--status-red)' }} />
            </FormField>
          </div>
        </TMCard>
      </Section>


      {/* ════════════════════ EMPTY STATES ════════════════════ */}
      <Section title="EMPTY STATES">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TMCard>
            <EmptyState
              icon="catalog"
              title="No tracks yet"
              description="Import your catalog from Spotify or add tracks manually."
              action={<Button variant="primary" size="sm" icon={<Plus size={14} />}>Add Track</Button>}
            />
          </TMCard>
          <TMCard>
            <EmptyState
              icon="live"
              title="No upcoming shows"
              description="Schedule your first show to see it here."
              action={<Button variant="primary" size="sm" icon={<Plus size={14} />}>Add Show</Button>}
            />
          </TMCard>
          <TMCard>
            <EmptyState
              icon="finance"
              title="No transactions"
              description="Financial data will appear once you connect your accounts."
              compact
            />
          </TMCard>
        </div>
      </Section>


      {/* ════════════════════ DROPDOWN ════════════════════ */}
      <Section title="DROPDOWN MENU">
        <TMCard padded>
          <div className="flex items-center gap-4">
            <Dropdown
              trigger={<Button variant="secondary" icon={<MoreVertical size={14} />}>Actions</Button>}
              items={[
                { id: 'edit', label: 'Edit Track', icon: <Edit3 size={14} />, onClick: () => {} },
                { id: 'copy', label: 'Copy ISRC', icon: <Copy size={14} />, onClick: () => {} },
                { id: 'download', label: 'Download', icon: <Download size={14} />, onClick: () => {} },
                { id: 'div', label: '', divider: true },
                { id: 'delete', label: 'Delete Track', icon: <Trash2 size={14} />, danger: true, onClick: () => {} },
              ]}
            />

            <Dropdown
              trigger={<Button iconOnly icon={<MoreVertical size={16} />} />}
              items={[
                { id: 'view', label: 'View Details', onClick: () => {} },
                { id: 'share', label: 'Share Link', onClick: () => {} },
              ]}
            />
          </div>
        </TMCard>
      </Section>


      {/* ════════════════════ PROGRESS ════════════════════ */}
      <Section title="PROGRESS BARS">
        <TMCard padded>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: 12, color: 'var(--t2)' }}>Catalog Complete</span>
                <span style={{ fontSize: 12, color: 'var(--t1)' }}>75%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: '75%' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: 12, color: 'var(--t2)' }}>Budget Used</span>
                <span style={{ fontSize: 12, color: 'var(--status-yellow)' }}>45%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: '45%', background: 'var(--status-yellow)' }} />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span style={{ fontSize: 12, color: 'var(--t2)' }}>Storage</span>
                <span style={{ fontSize: 12, color: 'var(--status-red)' }}>92%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: '92%', background: 'var(--status-red)' }} />
              </div>
            </div>
          </div>
        </TMCard>
      </Section>


      {/* ════════════════════ SPACING ════════════════════ */}
      <Section title="SPACING REFERENCE">
        <TMCard padded>
          <div className="space-y-3">
            {[
              { name: 'xs', val: '4px' },
              { name: 'sm', val: '8px' },
              { name: 'md', val: '12px' },
              { name: 'lg', val: '16px' },
              { name: 'xl', val: '24px' },
              { name: '2xl', val: '32px' },
              { name: '3xl', val: '48px' },
              { name: 'section-gap', val: '28px' },
            ].map((s) => (
              <div key={s.name} className="flex items-center gap-3">
                <span style={{ fontSize: 11, color: 'var(--t3)', width: 80, textAlign: 'right', fontFamily: 'monospace' }}>
                  --space-{s.name}
                </span>
                <div style={{ width: s.val, height: 12, background: 'var(--brand-1)', borderRadius: 2, opacity: 0.6 }} />
                <span style={{ fontSize: 11, color: 'var(--t2)' }}>{s.val}</span>
              </div>
            ))}
          </div>
        </TMCard>
      </Section>

    </div>
  );
}


/* ── Helper components ── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="section-title" style={{ marginBottom: 16 }}>{title}</div>
      {children}
    </section>
  );
}

function Swatch({ color, label, dark, border }: { color: string; label: string; dark?: boolean; border?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 'var(--radius-sm)',
          background: color,
          border: border ? '1px solid var(--border-2)' : 'none',
          flexShrink: 0,
        }}
      />
      <div>
        <div style={{ fontSize: 12, fontWeight: 500, color: dark ? color : 'var(--t1)' }}>{label}</div>
        <div style={{ fontSize: 10, color: 'var(--t3)', fontFamily: 'monospace' }}>{color}</div>
      </div>
    </div>
  );
}
