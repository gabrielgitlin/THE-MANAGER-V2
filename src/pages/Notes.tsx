import React, { useState, useEffect } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import type { Note as NoteType, NoteCategory } from '../types';
import { formatDate, formatDateTime } from '../lib/utils';
import * as noteService from '../lib/noteService';

interface Note extends Omit<NoteType, 'id'> {
  id: number | string;
}

export default function Notes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedContent, setEditedContent] = useState('');
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      setIsLoading(true);
      const fetchedNotes = await noteService.getUserNotes();
      const mappedNotes: Note[] = fetchedNotes.map(note => ({
        id: note.id,
        title: note.title,
        content: note.content,
        category: note.category as NoteCategory,
        color: note.color,
        minimized: note.minimized,
        gridX: note.grid_x,
        gridY: note.grid_y,
        gridWidth: note.grid_width,
        gridHeight: note.grid_height,
        createdAt: note.created_at,
        createdBy: note.user_id,
      }));
      setNotes(mappedNotes);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote) return;

    setIsSaving(true);
    try {
      await noteService.updateNote(selectedNote.id as string, {
        title: editedTitle,
        content: editedContent,
      });

      const updatedNotes = notes.map(note =>
        note.id === selectedNote.id
          ? { ...note, title: editedTitle, content: editedContent }
          : note
      );

      setNotes(updatedNotes);
      setSelectedNote({ ...selectedNote, title: editedTitle, content: editedContent });
      setIsEditing(false);
    } catch (error) {
      console.error('Error saving note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateNote = async () => {
    if (!newNoteTitle.trim()) return;

    setIsSaving(true);
    try {
      const newNote = await noteService.createNote({
        title: newNoteTitle.trim(),
        content: newNoteContent.trim(),
        category: 'other',
        color: 'bg-beige',
        grid_x: 0,
        grid_y: 0,
        grid_width: 1,
        grid_height: 1,
      });

      const mappedNote: Note = {
        id: newNote.id,
        title: newNote.title,
        content: newNote.content,
        category: newNote.category as NoteCategory,
        color: newNote.color,
        minimized: newNote.minimized,
        gridX: newNote.grid_x,
        gridY: newNote.grid_y,
        gridWidth: newNote.grid_width,
        gridHeight: newNote.grid_height,
        createdAt: newNote.created_at,
        createdBy: newNote.user_id,
      };

      setNotes([mappedNote, ...notes]);
      setNewNoteTitle('');
      setNewNoteContent('');
      setIsCreatingNote(false);
      setSelectedNote(mappedNote);
      setEditedTitle(mappedNote.title || '');
      setEditedContent(mappedNote.content);
    } catch (error) {
      console.error('Error creating note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (noteId: number | string) => {
    try {
      await noteService.deleteNote(noteId as string);
      setNotes(notes.filter(note => note.id !== noteId));
      if (selectedNote?.id === noteId) {
        setSelectedNote(null);
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center" style={{backgroundColor: "var(--bg)"}}>
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3" style={{color: "var(--t3)"}}>Loading notes...</span>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-8" style={{backgroundColor: "var(--bg)"}}>
      <div className="w-2/3 flex flex-col shadow-md overflow-hidden" style={{backgroundColor: "var(--surface)"}}>
        <div style={{padding: "24px", borderBottom: "1px solid var(--border)"}} className="flex items-center justify-between">
          <h2 className="text-lg font-medium uppercase" style={{color: "var(--t1)"}}>Notes</h2>
          <button
            onClick={() => setIsCreatingNote(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
        </div>

        {isCreatingNote && (
          <div style={{padding: "24px", borderBottom: "1px solid var(--border)", backgroundColor: "var(--surface-2)"}}>
            <h3 className="text-base font-medium mb-4" style={{color: "var(--t1)"}}>Create New Note</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1" style={{color: "var(--t2)"}}>
                  Title
                </label>
                <input
                  type="text"
                  value={newNoteTitle}
                  placeholder="Enter note title..."
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  style={{backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--t1)"}}
                  className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{color: "var(--t2)"}}>
                  Content
                </label>
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  rows={6}
                  placeholder="Enter note content..."
                  style={{backgroundColor: "var(--surface)", borderColor: "var(--border)", color: "var(--t1)"}}
                  className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsCreatingNote(false);
                    setNewNoteTitle('');
                    setNewNoteContent('');
                  }}
                  style={{color: "var(--t2)", backgroundColor: "var(--surface-3)", borderColor: "var(--border)"}}
                  className="px-4 py-2 text-sm font-medium border hover:brightness-125"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNote}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
                  disabled={!newNoteTitle.trim() || isSaving}
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Create Note
                </button>
              </div>
            </div>
          </div>
        )}

        <div style={{flex: 1, overflowY: "auto", borderCollapse: "collapse"}}>
          {notes.map((note) => (
            <div
              key={note.id}
              style={{padding: "24px", borderBottom: "1px solid var(--border)", backgroundColor: selectedNote?.id === note.id ? "var(--surface-2)" : "var(--surface)", cursor: "pointer"}}
              className="hover:brightness-125"
            >
              <div className="flex items-center justify-between">
                <button
                  onClick={() => {
                    setSelectedNote(note);
                    setEditedTitle(note.title || '');
                    setEditedContent(note.content);
                    setIsEditing(false);
                  }}
                  className="flex-1 text-left"
                >
                  <h3 className="text-base font-medium" style={{color: "var(--t1)"}}>
                    {note.title || 'Untitled Note'}
                  </h3>
                  <p className="text-sm mt-1" style={{color: "var(--t3)"}}>
                    {formatDate(note.createdAt)}
                  </p>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this note?')) {
                      handleDeleteNote(note.id);
                    }
                  }}
                  style={{color: "var(--t3)"}}
                  className="p-2 hover:text-red-500"
                >
                  <img src="/TM-Trash-negro.svg" className="pxi-md icon-danger" alt="" />
                </button>
              </div>
            </div>
          ))}

          {notes.length === 0 && (
            <div style={{padding: "32px", textAlign: "center"}}>
              <p className="text-sm" style={{color: "var(--t3)"}}>No notes yet. Create your first note to get started.</p>
            </div>
          )}
        </div>
      </div>

      <div className="w-1/3 shadow-md overflow-hidden" style={{backgroundColor: "var(--surface)"}}>
        {selectedNote ? (
          <div style={{height: "100%", display: "flex", flexDirection: "column"}}>
            <div style={{padding: "24px", borderBottom: "1px solid var(--border)"}}>
              <div className="flex items-center justify-between">
                <span className="text-sm" style={{color: "var(--t3)"}}>
                  {formatDateTime(selectedNote.createdAt)}
                </span>
                <button
                  onClick={() => {
                    if (isEditing) {
                      handleSaveNote();
                    } else {
                      setIsEditing(true);
                    }
                  }}
                  disabled={isSaving}
                  style={{color: "var(--t3)"}}
                  className="p-2 hover:text-primary disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isEditing ? (
                    <img src="/The Manager_Iconografia-11.svg" className="pxi-lg icon-white" alt="" />
                  ) : (
                    <img src="/TM-Pluma-negro.png" className="pxi-lg icon-white" alt="" />
                  )}
                </button>
              </div>
            </div>

            <div style={{flex: 1, padding: "24px", overflowY: "auto"}}>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{color: "var(--t2)"}}>
                      Title
                    </label>
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      style={{backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)"}}
                      className="block w-full shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{color: "var(--t2)"}}>
                      Content
                    </label>
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      style={{width: "100%", height: "calc(100vh-28rem)", resize: "none", backgroundColor: "var(--surface-2)", borderColor: "var(--border)", color: "var(--t1)"}}
                      className="shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-semibold mb-4" style={{color: "var(--t1)"}}>{selectedNote.title || 'Untitled Note'}</h2>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap" style={{color: "var(--t2)"}}>{selectedNote.content}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--t3)"}}>
            Select a note to view details
          </div>
        )}
      </div>
    </div>
  );
}
