import { useState, useEffect, useRef } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import * as noteService from '../../lib/noteService';
import type { Note } from '../../lib/noteService';

const NOTE_COLORS = [
  { id: 'green', bg: 'rgba(0,156,85,0.12)', border: 'rgba(0,156,85,0.25)' },
  { id: 'yellow', bg: 'rgba(221,170,68,0.12)', border: 'rgba(221,170,68,0.25)' },
  { id: 'red', bg: 'rgba(221,85,85,0.10)', border: 'rgba(221,85,85,0.2)' },
  { id: 'blue', bg: 'rgba(100,150,255,0.10)', border: 'rgba(100,150,255,0.25)' },
  { id: 'default', bg: 'var(--surface-2)', border: 'var(--border-2)' },
];

function getColorStyle(colorStr: string) {
  const found = NOTE_COLORS.find(c => c.id === colorStr);
  return found || NOTE_COLORS[4];
}

export default function NotesWidget() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [color, setColor] = useState('yellow');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { fetchNotes(); }, []);
  useEffect(() => { if (adding || editing) setTimeout(() => inputRef.current?.focus(), 50); }, [adding, editing]);

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const data = await noteService.getUserNotes();
      setNotes(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addNote = async () => {
    if (!content.trim()) return;
    try {
      const note = await noteService.createNote({
        title: title.trim(),
        content: content.trim(),
        color,
        category: 'other',
      });
      setNotes(prev => [note, ...prev]);
      resetForm();
    } catch (e) { console.error(e); }
  };

  const saveEdit = async () => {
    if (!editing || !content.trim()) return;
    try {
      const updated = await noteService.updateNote(editing, {
        title: title.trim(),
        content: content.trim(),
        color,
      });
      setNotes(prev => prev.map(n => n.id === editing ? updated : n));
      resetForm();
    } catch (e) { console.error(e); }
  };

  const deleteNote = async (id: string) => {
    setNotes(prev => prev.filter(n => n.id !== id));
    if (editing === id) resetForm();
    try { await noteService.deleteNote(id); } catch (e) { fetchNotes(); }
  };

  const startEdit = (note: Note) => {
    setEditing(note.id);
    setTitle(note.title);
    setContent(note.content);
    setColor(note.color || 'yellow');
    setAdding(false);
  };

  const resetForm = () => {
    setAdding(false);
    setEditing(null);
    setTitle('');
    setContent('');
    setColor('yellow');
  };

  return (
    <div className="tm-card">
      {/* Header */}
      <div className="tm-card-header">
        <div className="flex items-center gap-2">
          <img src="/TM-Pluma-negro.png" alt="" style={{ width: 16, height: 16, filter: 'invert(1)', opacity: 0.4 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Notes
          </span>
          {notes.length > 0 && (
            <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 4 }}>{notes.length}</span>
          )}
        </div>
        <button
          onClick={() => { if (adding || editing) resetForm(); else setAdding(true); }}
          className="btn-icon sm"
          style={{ color: (adding || editing) ? 'var(--status-red)' : 'var(--brand-1)' }}
        >
          {(adding || editing) ? <X size={16} /> : <Plus size={16} />}
        </button>
      </div>

      {/* Add / Edit form */}
      {(adding || editing) && (
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title (optional)"
            style={{ width: '100%', height: 32, fontSize: 12, marginBottom: 8 }}
          />
          <textarea
            ref={inputRef}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="Write your note..."
            rows={3}
            style={{ width: '100%', fontSize: 13, resize: 'vertical', minHeight: 60 }}
          />
          <div className="flex items-center gap-2 mt-2">
            {NOTE_COLORS.map(c => (
              <button
                key={c.id}
                onClick={() => setColor(c.id)}
                style={{
                  width: 20, height: 20, borderRadius: '50%',
                  background: c.bg, border: `2px solid ${color === c.id ? c.border : 'transparent'}`,
                  cursor: 'pointer',
                }}
              />
            ))}
            <div style={{ flex: 1 }} />
            <button onClick={editing ? saveEdit : addNote} className="btn btn-primary btn-sm" disabled={!content.trim()}>
              {editing ? 'Save' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* Notes grid */}
      <div style={{ padding: 12, maxHeight: 380, overflowY: 'auto' }}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--t3)' }} />
          </div>
        ) : notes.length === 0 ? (
          <div className="empty-state" style={{ padding: '24px 16px' }}>
            <img src="/TM-Pluma-negro.png" alt="" className="empty-state-icon" style={{ width: 36, height: 36 }} />
            <div className="empty-state-title">No notes yet</div>
            <div className="empty-state-desc">Click + to create a sticky note</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {notes.map(note => {
              const cs = getColorStyle(note.color);
              return (
                <div
                  key={note.id}
                  className="group"
                  style={{
                    background: cs.bg,
                    border: `1px solid ${cs.border}`,
                    borderRadius: 'var(--radius-sm)',
                    padding: '10px 12px',
                    position: 'relative',
                    minHeight: 70,
                    cursor: 'pointer',
                    transition: 'transform 0.1s',
                  }}
                  onClick={() => startEdit(note)}
                >
                  {note.title && (
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--t1)', marginBottom: 4, lineHeight: 1.3 }}>
                      {note.title}
                    </div>
                  )}
                  <div style={{
                    fontSize: 12, color: 'var(--t2)', lineHeight: 1.4,
                    display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {note.content}
                  </div>
                  {/* Actions on hover */}
                  <div
                    className="absolute top-1 right-1 flex gap-0.5"
                    style={{ opacity: 0, transition: 'opacity 0.1s' }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                  >
                    <button
                      onClick={e => { e.stopPropagation(); deleteNote(note.id); }}
                      className="btn-icon sm"
                      style={{ color: 'var(--status-red)', width: 22, height: 22 }}
                    >
                      <img src="/TM-Trash-negro.svg" className="pxi-sm icon-danger" alt="" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
