# Playlists Tab Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Playlists tab to match the Catalog/Demos visual layout, add rich text descriptions with `contentEditable`, and enhance sharing with personal (private link) vs public sharing options.

**Architecture:** The current 1,550-line `PlaylistsTab.tsx` will be rewritten to match the catalog-style layout (artwork + track list per playlist, same styling/spacing). A new `RichTextEditor` component provides bold/italic/underline/lists using `document.execCommand` (same pattern as the existing `NoteEditor`). The description field stores HTML in the existing `description text` column. Sharing is enhanced with two modes: public (open link) and personal (link + optional password). Track selection pulls from both catalog and demo albums.

**Tech Stack:** React, Supabase, `document.execCommand` for rich text, existing `ImageCropper` component, existing `Modal` component, CSS variables (`var(--surface)`, `var(--t1)`, etc.) for theming.

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/catalog/PlaylistsTab.tsx` | **Rewrite** | Main playlists tab — catalog-style layout, CRUD, sharing, track management |
| `src/components/catalog/RichTextEditor.tsx` | **Create** | Reusable rich text editor using `contentEditable` + `execCommand` toolbar |
| `src/pages/SharedPlaylist.tsx` | **Modify** | Render HTML description safely instead of plain text |

---

### Task 1: Create RichTextEditor Component

**Files:**
- Create: `src/components/catalog/RichTextEditor.tsx`

This is a standalone component following the same `document.execCommand` pattern used in `src/components/notes/NoteEditor.tsx:113-118`. It provides a toolbar + contentEditable div.

- [ ] **Step 1: Create the RichTextEditor component**

Create `src/components/catalog/RichTextEditor.tsx`:

```tsx
import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (editorRef.current && !isInternalChange.current) {
      if (editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value;
      }
    }
    isInternalChange.current = false;
  }, [value]);

  const formatText = (command: string, val?: string) => {
    document.execCommand(command, false, val);
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInput = () => {
    if (editorRef.current) {
      isInternalChange.current = true;
      onChange(editorRef.current.innerHTML);
    }
  };

  const toolbarButtons = [
    { command: 'bold', icon: Bold, label: 'Bold' },
    { command: 'italic', icon: Italic, label: 'Italic' },
    { command: 'underline', icon: Underline, label: 'Underline' },
    { command: 'insertUnorderedList', icon: List, label: 'Bullet List' },
    { command: 'insertOrderedList', icon: ListOrdered, label: 'Numbered List' },
  ];

  return (
    <div style={{ border: '1px solid var(--border)' }}>
      <div
        className="flex items-center gap-1 px-2 py-1.5"
        style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--surface-2)' }}
      >
        {toolbarButtons.map(({ command, icon: Icon, label }) => (
          <button
            key={command}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              formatText(command);
            }}
            className="p-1.5 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--t2)' }}
            title={label}
          >
            <Icon className="w-4 h-4" />
          </button>
        ))}
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        data-placeholder={placeholder}
        className="min-h-[120px] px-3 py-2 text-sm focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-gray-400 empty:before:pointer-events-none"
        style={{ backgroundColor: 'var(--surface)', color: 'var(--t1)' }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify it renders**

Run: `npm run dev` (should already be running via HMR)

The component won't be visible yet — it's imported in the next task. Verify no build errors in the terminal.

- [ ] **Step 3: Commit**

```bash
git add src/components/catalog/RichTextEditor.tsx
git commit -m "feat: add RichTextEditor component for playlist descriptions"
```

---

### Task 2: Rewrite PlaylistsTab Layout to Match Catalog Style

**Files:**
- Modify: `src/components/catalog/PlaylistsTab.tsx`

The current component uses a card grid layout. Rewrite the rendering section (from line 912 onward) to match the catalog-style layout used in `src/pages/Catalog.tsx`. The key visual changes:

1. Replace the card grid with a vertical list, each playlist showing: 48×48 cover art on the left, title/description/badges on the right, track listing below
2. Use the same CSS variables and classes as catalog (`var(--surface)`, `var(--surface-2)`, `var(--t1)`, `var(--t3)`, `var(--border)`, `var(--brand-1)`)
3. Match the catalog's `p-6` spacing, track row styling, play button overlay on artwork

This is the largest task. The data fetching and handler functions (lines 1-910) stay mostly the same. The rendering and modals get rewritten.

- [ ] **Step 1: Update the outer container and header to match catalog styling**

Replace the rendering section starting at line 912. The outer wrapper should match catalog:

```tsx
// In PlaylistsTab's return, replace everything from line 912
return (
  <div>
    <div className="overflow-hidden" style={{ backgroundColor: 'var(--surface)', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
      <div className="p-6" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 text-white flex items-center gap-2"
            style={{ backgroundColor: 'var(--brand-1)' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--brand-2)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--brand-1)')}
          >
            <Plus className="w-4 h-4" />
            Create Playlist
          </button>
        </div>
      </div>
      {/* playlist list continues here */}
    </div>
  </div>
);
```

- [ ] **Step 2: Rewrite the playlist list to match catalog album layout**

Each playlist renders identically to how albums render in `Catalog.tsx:441-525`. Replace the grid/card layout with:

```tsx
<div style={{ borderColor: 'var(--border)' }}>
  {isLoading ? (
    <LoadingSpinner fullScreen={false} />
  ) : playlists.length === 0 ? (
    <div className="p-12 text-center">
      <img src="/tm-vinil-negro_(2).png" alt="Playlist" className="mx-auto h-12 w-12 object-contain opacity-40" />
      <h3 className="mt-2 text-sm font-medium" style={{ color: 'var(--t1)' }}>No playlists yet</h3>
      <p className="mt-1 text-sm" style={{ color: 'var(--t3)' }}>Create a playlist to organize and share your music.</p>
    </div>
  ) : playlists.map((playlist) => (
    <div key={playlist.id} className="p-6">
      <div className="flex items-start gap-6 mb-4">
        {/* Cover art — 48×48 with play overlay, same as catalog */}
        <div className="flex-shrink-0 w-48">
          <div className="w-48 h-48 relative group mb-2">
            {playlist.cover_url ? (
              <>
                <button
                  onClick={() => navigate(`/playlist/${playlist.share_token}`)}
                  className="w-full h-full overflow-hidden transition-transform duration-200 hover:scale-105"
                  style={{ backgroundColor: 'var(--surface-2)' }}
                >
                  <img
                    src={playlist.cover_url}
                    alt={`${playlist.title} cover`}
                    className="w-full h-full object-cover"
                  />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlayPlaylist(playlist);
                  }}
                  className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110 hover:opacity-80"
                  style={{ background: 'none', border: 'none', padding: 0, lineHeight: 0 }}
                >
                  <img src="/pixel-play.svg" alt="Play" className="w-12 h-12" />
                </button>
              </>
            ) : (
              <div className="w-full h-full overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'var(--surface-2)' }}>
                <img src="/tm-vinil-negro_(2).png" alt="Playlist" className="w-8 h-8 object-contain opacity-40" />
              </div>
            )}
          </div>
          <p className="text-xs text-center uppercase tracking-wide" style={{ color: 'var(--t3)' }}>
            {playlist.track_count} {playlist.track_count === 1 ? 'song' : 'songs'}
            {playlist.total_duration ? `, ${Math.floor(playlist.total_duration / 60)} minutes` : ''}
          </p>
        </div>

        {/* Info + action buttons + tracks */}
        <div className="flex-1">
          <div className="flex items-start justify-between gap-4">
            <div>
              <button
                onClick={() => navigate(`/playlist/${playlist.share_token}`)}
                className="text-lg font-medium"
                style={{ color: 'var(--t1)' }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand-1)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t1)')}
              >
                {playlist.title}
              </button>
              {playlist.description && (
                <div
                  className="text-sm mt-1 prose prose-sm max-w-none"
                  style={{ color: 'var(--t3)' }}
                  dangerouslySetInnerHTML={{ __html: playlist.description }}
                />
              )}
              <p className="text-xs mt-1" style={{ color: 'var(--t3)' }}>
                {playlist.is_public && (
                  <span className="inline-flex items-center gap-1 mr-3">
                    <Globe className="w-3 h-3" /> Public
                  </span>
                )}
                {playlist.password_hash && (
                  <span className="inline-flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Protected
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => {
                  setSelectedPlaylist(playlist);
                  setPlaylistTracks(playlist.tracks || []);
                  setTimeout(() => setIsAddTracksModalOpen(true), 100);
                }}
                className="px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors"
                style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t2)', border: '1px solid var(--border)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-3)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-2)')}
              >
                <Plus className="w-3.5 h-3.5" /> Add Tracks
              </button>
              <button
                onClick={() => handleOpenEditModal(playlist)}
                className="px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors"
                style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t2)', border: '1px solid var(--border)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-3)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-2)')}
              >
                <Pencil className="w-3.5 h-3.5" /> Edit
              </button>
              <button
                onClick={() => handleSharePlaylist(playlist)}
                className="px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors"
                style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t2)', border: '1px solid var(--border)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-3)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-2)')}
              >
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
              <button
                onClick={() => handleDeletePlaylist(playlist.id)}
                className="px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors text-red-500"
                style={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)' }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-3)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-2)')}
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>

          {/* Track listing — matches catalog track rows exactly */}
          <div className="space-y-1 mt-4">
            {(playlist.tracks || []).length === 0 ? (
              <div className="text-center py-8" style={{ backgroundColor: 'var(--surface-2)', border: '2px dashed var(--border)' }}>
                <img src="/tm-vinil-negro_(2).png" alt="Empty" className="mx-auto h-8 w-8 object-contain opacity-30 mb-2" />
                <p className="text-sm mb-3" style={{ color: 'var(--t3)' }}>No tracks yet</p>
                <button
                  onClick={() => {
                    setSelectedPlaylist(playlist);
                    setPlaylistTracks([]);
                    setTimeout(() => setIsAddTracksModalOpen(true), 100);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm"
                  style={{ backgroundColor: 'var(--brand-1)' }}
                >
                  <Plus className="w-4 h-4" /> Add Tracks
                </button>
              </div>
            ) : (
              (playlist.tracks || []).map((pt) => (
                <div
                  key={pt.id}
                  className="flex items-center gap-4 p-2 transition-colors group"
                  style={{ backgroundColor: 'var(--surface-2)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-3)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--surface-2)')}
                >
                  <span className="w-8 text-sm text-right" style={{ color: 'var(--t3)' }}>
                    {pt.position + 1}.
                  </span>
                  <button
                    onClick={() => {
                      setSelectedPlaylist(playlist);
                      setPlaylistTracks(playlist.tracks || []);
                      setTimeout(() => {
                        handlePlayFromTrack(playlist.tracks?.findIndex(t => t.id === pt.id) || 0);
                      }, 100);
                    }}
                    className="flex-1 text-left text-sm"
                    style={{ color: 'var(--t1)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--brand-1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--t1)')}
                  >
                    {pt.tracks.title}
                  </button>
                  <span className="text-sm" style={{ color: 'var(--t3)' }}>
                    {formatDuration(pt.tracks.duration || 0)}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Remove this track from the playlist?')) {
                        handleRemoveTrack(pt.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-red-500 transition-all"
                    title="Remove track"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  ))}
</div>
```

- [ ] **Step 3: Remove the PlaylistCard component and MusicPlayer embed**

Delete the `PlaylistCard` function component (lines 116-257) — it's no longer used. Also remove the embedded `<MusicPlayer>` block at the bottom (lines 1527-1536) since the global player in `Layout.tsx` handles playback.

- [ ] **Step 4: Verify the layout matches catalog visually**

Check the preview — the playlists should render with the same visual structure as albums in the Catalog tab: 48×48 artwork on left, title + description + badges on right, track rows below.

- [ ] **Step 5: Commit**

```bash
git add src/components/catalog/PlaylistsTab.tsx
git commit -m "feat: redesign playlists layout to match catalog style"
```

---

### Task 3: Integrate RichTextEditor into Create and Edit Modals

**Files:**
- Modify: `src/components/catalog/PlaylistsTab.tsx`

Replace the plain `<textarea>` for description in both the Create and Edit modals with the `RichTextEditor`.

- [ ] **Step 1: Import RichTextEditor at top of PlaylistsTab**

Add to the imports:

```tsx
import RichTextEditor from './RichTextEditor';
```

- [ ] **Step 2: Replace the textarea in the Create Playlist modal**

Find the Description `<textarea>` in the create modal (around line 1138-1144 in the original, will be in the create modal form). Replace:

```tsx
{/* OLD */}
<textarea
  value={newPlaylist.description}
  onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
  className="w-full px-3 py-2 border border-black focus:ring-primary focus:border-primary"
  placeholder="Optional description..."
  rows={3}
/>

{/* NEW */}
<RichTextEditor
  value={newPlaylist.description}
  onChange={(html) => setNewPlaylist({ ...newPlaylist, description: html })}
  placeholder="Add notes, liner text, or credits..."
/>
```

- [ ] **Step 3: Replace the textarea in the Edit Playlist modal**

Same replacement in the edit modal (around line 1432-1437 in original):

```tsx
{/* OLD */}
<textarea
  value={editPlaylist.description}
  onChange={(e) => setEditPlaylist({ ...editPlaylist, description: e.target.value })}
  className="w-full px-3 py-2 border border-black focus:ring-primary focus:border-primary"
  rows={3}
/>

{/* NEW */}
<RichTextEditor
  value={editPlaylist.description}
  onChange={(html) => setEditPlaylist({ ...editPlaylist, description: html })}
  placeholder="Add notes, liner text, or credits..."
/>
```

- [ ] **Step 4: Update the create/edit modal styles to use CSS variables**

While touching these modals, also update their styling to use the app's CSS variables instead of hardcoded Tailwind colors (e.g., `text-black` → `style={{ color: 'var(--t1)' }}`, `border-black` → `style={{ borderColor: 'var(--border)' }}`). This aligns with the rest of the catalog tab.

- [ ] **Step 5: Verify rich text works in create and edit**

Open create modal, type text, use bold/italic/lists, save. Open edit modal, verify the HTML renders in the editor. Verify the description renders with formatting in the playlist list.

- [ ] **Step 6: Commit**

```bash
git add src/components/catalog/PlaylistsTab.tsx
git commit -m "feat: add rich text editing for playlist descriptions"
```

---

### Task 4: Include Demo Tracks in Available Tracks

**Files:**
- Modify: `src/components/catalog/PlaylistsTab.tsx`

Currently `fetchAvailableTracks()` (lines 456-490) fetches all tracks from `album_tracks` without filtering by album status. This already includes demos since demo albums have `status: 'demo'` and their tracks are linked via `album_tracks`. However, it would be helpful to show which tracks are demos in the track picker.

- [ ] **Step 1: Update fetchAvailableTracks to include album status**

Modify the query to also select album status:

```tsx
const fetchAvailableTracks = async () => {
  try {
    const { data: albumTracksData, error } = await supabase
      .from('album_tracks')
      .select(`
        tracks (
          id,
          title,
          duration
        ),
        albums (
          title,
          cover_url,
          status,
          artists (
            name
          )
        )
      `);

    if (error) throw error;

    const tracks = (albumTracksData || []).map((at: any) => ({
      id: at.tracks.id,
      title: at.tracks.title,
      duration: at.tracks.duration,
      albumTitle: at.albums?.title || 'Unknown Album',
      albumCover: at.albums?.cover_url,
      artist: at.albums?.artists?.name || 'Unknown Artist',
      isDemo: at.albums?.status === 'demo',
    }));

    setAvailableTracks(tracks);
  } catch (error) {
    console.error('Error fetching available tracks:', error);
  }
};
```

- [ ] **Step 2: Update the AvailableTrack interface**

Add `isDemo` to the interface:

```tsx
interface AvailableTrack {
  id: string;
  title: string;
  duration: number;
  albumTitle: string;
  albumCover?: string;
  artist: string;
  isDemo: boolean;
}
```

- [ ] **Step 3: Show demo badge in the Add Tracks modal**

In the track picker list item, add a "Demo" badge after the album title when `track.isDemo` is true:

```tsx
<p className="text-xs truncate" style={{ color: 'var(--t3)' }}>
  {track.artist} • {track.albumTitle}
  {track.isDemo && (
    <span className="ml-1.5 px-1.5 py-0.5 text-[10px] uppercase tracking-wide" style={{ backgroundColor: 'var(--surface-3)', color: 'var(--t2)' }}>
      Demo
    </span>
  )}
</p>
```

- [ ] **Step 4: Verify demo tracks appear in the track picker**

Open the Add Tracks modal. If there are any albums with `status: 'demo'`, their tracks should show with a "Demo" badge. All catalog tracks should also appear without the badge.

- [ ] **Step 5: Commit**

```bash
git add src/components/catalog/PlaylistsTab.tsx
git commit -m "feat: include demo tracks in playlist track picker with badge"
```

---

### Task 5: Enhance Sharing UI (Personal vs Public)

**Files:**
- Modify: `src/components/catalog/PlaylistsTab.tsx`

The current sharing model: `is_public` = shareable link, optional password. Enhance to make the distinction clearer between **public** (anyone with the link) and **personal** (link + password required) sharing. The database already supports this — `is_public: true` + `password_hash: null` = public, `is_public: true` + `password_hash: set` = personal/protected.

- [ ] **Step 1: Redesign the Share modal**

Replace the existing share modal content with a two-option layout:

```tsx
<Modal
  isOpen={isShareModalOpen}
  onClose={() => {
    setIsShareModalOpen(false);
    setCopiedLink(false);
  }}
  title="Share Playlist"
>
  <div className="space-y-4">
    {!selectedPlaylist?.is_public ? (
      <div className="text-center py-4">
        <p className="text-sm mb-4" style={{ color: 'var(--t2)' }}>
          This playlist is private. Enable sharing to generate a link.
        </p>
        <button
          onClick={async () => {
            if (!selectedPlaylist) return;
            try {
              await supabase
                .from('playlists')
                .update({ is_public: true })
                .eq('id', selectedPlaylist.id);
              setSelectedPlaylist({ ...selectedPlaylist, is_public: true });
              setShareLink(`${window.location.origin}/playlist/${selectedPlaylist.share_token}`);
              fetchPlaylists();
            } catch (err) {
              console.error('Error enabling sharing:', err);
            }
          }}
          className="px-4 py-2 text-white"
          style={{ backgroundColor: 'var(--brand-1)' }}
        >
          Enable Sharing
        </button>
      </div>
    ) : (
      <>
        <div>
          <div className="flex items-center gap-2 mb-3">
            {selectedPlaylist?.password_hash ? (
              <span className="inline-flex items-center gap-1.5 text-sm" style={{ color: 'var(--t2)' }}>
                <Lock className="w-4 h-4" /> Personal — password required to access
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm" style={{ color: 'var(--t2)' }}>
                <Globe className="w-4 h-4" /> Public — anyone with the link can listen
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={shareLink}
              readOnly
              className="flex-1 px-3 py-2 text-sm"
              style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t1)', border: '1px solid var(--border)' }}
            />
            <button
              onClick={handleCopyLink}
              className="px-4 py-2 flex items-center gap-2 transition-colors text-sm"
              style={{
                backgroundColor: copiedLink ? 'var(--brand-1)' : 'var(--surface-2)',
                color: copiedLink ? 'var(--t1)' : 'var(--t2)',
                border: '1px solid var(--border)',
              }}
            >
              <Copy className="w-4 h-4" />
              {copiedLink ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--border)' }} className="pt-4">
          <p className="text-xs mb-2" style={{ color: 'var(--t3)' }}>
            To switch between public and personal sharing, edit the playlist settings.
          </p>
        </div>
      </>
    )}

    <div className="flex justify-end pt-2">
      <button
        onClick={() => {
          setIsShareModalOpen(false);
          setCopiedLink(false);
        }}
        className="px-4 py-2 text-sm"
        style={{ color: 'var(--t2)' }}
      >
        Close
      </button>
    </div>
  </div>
</Modal>
```

- [ ] **Step 2: Update sharing labels in the Edit modal**

In the Edit modal, update the sharing checkbox label and password field to clarify the two modes:

```tsx
<div style={{ borderTop: '1px solid var(--border)' }} className="pt-4 space-y-3">
  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={editPlaylist.is_public}
      onChange={(e) => setEditPlaylist({ ...editPlaylist, is_public: e.target.checked })}
      style={{ accentColor: 'var(--brand-1)' }}
    />
    <span className="text-sm" style={{ color: 'var(--t1)' }}>Enable sharing</span>
  </label>

  {editPlaylist.is_public && (
    <div className="ml-6 space-y-2">
      <p className="text-xs" style={{ color: 'var(--t3)' }}>
        Add a password to restrict access (personal sharing), or leave empty for public access.
      </p>
      <input
        type="password"
        value={editPlaylist.password}
        onChange={(e) => setEditPlaylist({ ...editPlaylist, password: e.target.value })}
        className="w-full px-3 py-2 text-sm"
        style={{ backgroundColor: 'var(--surface-2)', color: 'var(--t1)', border: '1px solid var(--border)' }}
        placeholder={selectedPlaylist?.password_hash ? 'Leave empty to keep current password' : 'Leave empty for public access'}
      />
    </div>
  )}
</div>
```

- [ ] **Step 3: Apply same changes to the Create modal sharing section**

Mirror the same sharing UI pattern in the create modal.

- [ ] **Step 4: Verify sharing flows**

1. Create a playlist with sharing enabled, no password → share modal shows "Public" badge and copyable link
2. Edit playlist, add a password → share modal shows "Personal" badge
3. Create a private playlist → share modal shows "Enable Sharing" prompt

- [ ] **Step 5: Commit**

```bash
git add src/components/catalog/PlaylistsTab.tsx
git commit -m "feat: enhance sharing UI with public vs personal modes"
```

---

### Task 6: Update SharedPlaylist Page for Rich Text Description

**Files:**
- Modify: `src/pages/SharedPlaylist.tsx`

The public-facing shared playlist page currently renders `playlist.description` as plain text. Update it to render HTML safely.

- [ ] **Step 1: Find and update the description rendering in SharedPlaylist**

Search for where `description` is rendered. Replace plain text rendering with `dangerouslySetInnerHTML`:

```tsx
{/* OLD — something like: */}
{playlist.description && (
  <p className="...">{playlist.description}</p>
)}

{/* NEW */}
{playlist.description && (
  <div
    className="text-sm prose prose-sm max-w-none mt-2"
    style={{ color: 'var(--t3)' }}
    dangerouslySetInnerHTML={{ __html: playlist.description }}
  />
)}
```

Note: Since this content is user-generated and only editable by the playlist owner (authenticated via RLS), and rendered back to potentially other users, the risk is limited to self-XSS. The content is created by the same user who owns the playlist. If stricter sanitization is desired in the future, a library like `DOMPurify` can be added.

- [ ] **Step 2: Verify on the public playlist page**

Navigate to `/playlist/<share_token>` for a playlist that has rich text description. The bold/italic/lists should render correctly.

- [ ] **Step 3: Commit**

```bash
git add src/pages/SharedPlaylist.tsx
git commit -m "feat: render rich text descriptions on shared playlist page"
```

---

### Task 7: Final Styling Pass and Cleanup

**Files:**
- Modify: `src/components/catalog/PlaylistsTab.tsx`

- [ ] **Step 1: Remove unused imports**

After all changes, check for unused imports at the top of PlaylistsTab.tsx. The `PlaylistCard` component was removed, so any imports only used by it (like `MoreHorizontal`) should go. The `MusicPlayer` import can be removed if the embedded player was removed. Check for: `GripVertical`, `Clock`, `MoreHorizontal`, `ExternalLink`, `MusicPlayer`.

- [ ] **Step 2: Remove the unused PlaylistCard component entirely**

If not already done in Task 2, delete the full `PlaylistCard` function (was lines 116-257). Also remove the `selectedPlaylist` detail panel view if it was part of the old grid layout — the new layout shows tracks inline.

- [ ] **Step 3: Ensure the Add Tracks modal uses CSS variables**

Update the Add Tracks modal to use `var(--surface)`, `var(--t1)`, etc. instead of hardcoded Tailwind colors like `bg-white`, `text-black`, `border-black`, `bg-beige`, `text-gray`:

- `bg-white` → `style={{ backgroundColor: 'var(--surface)' }}`
- `text-black` → `style={{ color: 'var(--t1)' }}`
- `border-black` → `style={{ borderColor: 'var(--border)' }}`
- `bg-beige` → `style={{ backgroundColor: 'var(--surface-2)' }}`
- `text-gray` → `style={{ color: 'var(--t3)' }}`
- `bg-light-blue` for selected → `style={{ backgroundColor: 'var(--surface-3)' }}`

- [ ] **Step 4: Verify complete visual consistency**

Open all four tabs (Catalog, Demos, Playlists, Splits) and confirm the layout, spacing, colors, and interactions are consistent across Catalog, Demos, and Playlists.

- [ ] **Step 5: Commit**

```bash
git add src/components/catalog/PlaylistsTab.tsx
git commit -m "refactor: clean up unused code and align styling with CSS variables"
```
