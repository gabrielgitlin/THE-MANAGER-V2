import React, { forwardRef } from 'react';

export interface VintageTicketData {
  artistName: string;
  date: string;
  time?: string;
  venueName: string;
  city: string;
  country: string;
  tourName?: string;
}

interface VintageTicketProps {
  data: VintageTicketData;
  scale?: number;
}

const VintageTicket = forwardRef<HTMLDivElement, VintageTicketProps>(
  ({ data, scale = 1 }, ref) => {
    const formattedDate = new Date(data.date + 'T00:00:00').toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <div
        ref={ref}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: '600px',
          height: '250px',
          fontFamily: "'Georgia', 'Times New Roman', serif",
          position: 'relative',
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Main ticket body */}
        <div
          style={{
            flex: 1,
            background: 'linear-gradient(135deg, #f5e6c8 0%, #e8d5a3 30%, #f0ddb5 70%, #e5cfa0 100%)',
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            borderRadius: '8px 0 0 8px',
            border: '2px solid #c4a265',
            borderRight: 'none',
            position: 'relative',
          }}
        >
          {/* Decorative inner border */}
          <div style={{
            position: 'absolute',
            inset: '6px',
            border: '1px solid #c4a265',
            borderRadius: '4px',
            borderRight: 'none',
            pointerEvents: 'none',
          }} />

          {/* Top section */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            {data.tourName && (
              <div style={{
                fontSize: '10px',
                letterSpacing: '3px',
                textTransform: 'uppercase',
                color: '#8b6914',
                marginBottom: '4px',
                fontWeight: 600,
              }}>
                {data.tourName}
              </div>
            )}
            <div style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#2c1810',
              lineHeight: 1.1,
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}>
              {data.artistName}
            </div>
          </div>

          {/* Middle - venue */}
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: '14px', color: '#5a3e1b', fontWeight: 600 }}>
              {data.venueName}
            </div>
            <div style={{ fontSize: '12px', color: '#7a5c2e' }}>
              {data.city}, {data.country}
            </div>
          </div>

          {/* Bottom - date & time */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: '13px', color: '#2c1810', fontWeight: 600 }}>
                {formattedDate}
              </div>
              {data.time && (
                <div style={{ fontSize: '11px', color: '#7a5c2e' }}>
                  Doors: {data.time}
                </div>
              )}
            </div>
            <div style={{
              fontSize: '8px',
              color: '#a08050',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}>
              ADMIT ONE
            </div>
          </div>

          {/* Texture overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'4\' height=\'4\' viewBox=\'0 0 4 4\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M1 3h1v1H1V3zm2-2h1v1H3V1z\' fill=\'%23c4a265\' fill-opacity=\'0.08\'/%3E%3C/svg%3E")',
            pointerEvents: 'none',
          }} />
        </div>

        {/* Perforated edge */}
        <div style={{
          width: '2px',
          background: 'repeating-linear-gradient(to bottom, #c4a265 0px, #c4a265 4px, transparent 4px, transparent 8px)',
          flexShrink: 0,
        }} />

        {/* Stub (right side) */}
        <div
          style={{
            width: '100px',
            background: 'linear-gradient(135deg, #f0ddb5 0%, #e5cfa0 100%)',
            padding: '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
            borderRadius: '0 8px 8px 0',
            border: '2px solid #c4a265',
            borderLeft: 'none',
            position: 'relative',
          }}
        >
          <div style={{
            position: 'absolute',
            inset: '6px',
            border: '1px solid #c4a265',
            borderRadius: '4px',
            borderLeft: 'none',
            pointerEvents: 'none',
          }} />

          <div style={{
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#2c1810',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            position: 'relative',
            zIndex: 1,
          }}>
            {data.artistName.length > 15 ? data.artistName.substring(0, 15) + '...' : data.artistName}
          </div>

          <div style={{
            fontSize: '9px',
            color: '#7a5c2e',
            marginTop: '8px',
            position: 'relative',
            zIndex: 1,
          }}>
            {new Date(data.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>
    );
  }
);

VintageTicket.displayName = 'VintageTicket';
export default VintageTicket;
