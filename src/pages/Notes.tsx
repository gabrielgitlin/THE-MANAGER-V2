import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Save, Trash2, Loader2 } from 'lucide-react';
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
      <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-3 text-gray-500">Loading notes...</span>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-8">
      <div className="w-2/3 flex flex-col bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-lg font-medium text-charcoal uppercase">Notes</h2>
          <button
            onClick={() => setIsCreatingNote(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            New Note
          </button>
        </div>

        {isCreatingNote && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h3 className="text-base font-medium text-gray-900 mb-4">Create New Note</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  placeholder="Enter note title..."
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Content
                </label>
                <textarea
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  rows={6}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  placeholder="Enter note content..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsCreatingNote(false);
                    setNewNoteTitle('');
                    setNewNoteContent('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
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

        <div className="flex-1 overflow-auto divide-y divide-gray-200">
          {notes.map((note) => (
            <div
              key={note.id}
              className={`p-6 hover:bg-gray-50 cursor-pointer ${
                selectedNote?.id === note.id ? 'bg-gray-50' : ''
              }`}
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
                  <h3 className="text-base font-medium text-charcoal">
                    {note.title || 'Untitled Note'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
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
                  className="p-2 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {notes.length === 0 && (
            <div className="p-8 text-center">
              <p className="text-sm text-gray-500">No notes yet. Create your first note to get started.</p>
            </div>
          )}
        </div>
      </div>

      <div className="w-1/3 bg-white shadow-md rounded-lg overflow-hidden">
        {selectedNote ? (
          <div className="h-full flex flex-col">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
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
                  className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isEditing ? (
                    <Save className="w-5 h-5" />
                  ) : (
                    <Edit2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-auto">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Content
                    </label>
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full h-[calc(100vh-28rem)] resize-none border-gray-300 rounded-md shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <h2 className="text-xl font-semibold text-charcoal mb-4">{selectedNote.title || 'Untitled Note'}</h2>
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-gray-700">{selectedNote.content}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Select a note to view details
          </div>
        )}
      </div>
    </div>
  );
}
