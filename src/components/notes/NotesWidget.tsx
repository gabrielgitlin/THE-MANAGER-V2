import React, { useState, useEffect } from 'react';
import { Plus, ArrowRight, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { hasPermission } from '../../lib/permissions';
import NoteEditor from './NoteEditor';
import type { Note as NoteType, NoteCategory } from '../../types';
import * as noteService from '../../lib/noteService';

const GRID_COLUMNS = 4;
const GRID_GAP = 16;

interface Note extends Omit<NoteType, 'id'> {
  id: number | string;
}

export default function NotesWidget() {
  const { user } = useAuthStore();
  const canEdit = hasPermission(user, 'edit_catalog');
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedNoteId, setDraggedNoteId] = useState<number | string | null>(null);
  const [dragOverPosition, setDragOverPosition] = useState<{ x: number; y: number } | null>(null);
  const [resizingNote, setResizingNote] = useState<{ id: number | string; width: number; height: number } | null>(null);

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

  const findEmptyGridPosition = (): { x: number; y: number } => {
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < GRID_COLUMNS; x++) {
        const isOccupied = notes.some(
          note =>
            x >= note.gridX &&
            x < note.gridX + note.gridWidth &&
            y >= note.gridY &&
            y < note.gridY + note.gridHeight
        );
        if (!isOccupied) {
          return { x, y };
        }
      }
    }
    return { x: 0, y: Math.max(...notes.map(n => n.gridY + n.gridHeight), 0) };
  };

  const handleAddNote = async () => {
    const position = findEmptyGridPosition();

    try {
      const newNote = await noteService.createNote({
        content: '',
        category: 'other',
        color: 'bg-beige',
        grid_x: position.x,
        grid_y: position.y,
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

      setNotes([...notes, mappedNote]);
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const displayNotes = notes.length === 0 && canEdit && !isLoading ? [{
    id: 'placeholder' as string,
    content: '',
    category: 'other' as NoteCategory,
    color: 'bg-beige',
    minimized: false,
    gridX: 0,
    gridY: 0,
    gridWidth: 1,
    gridHeight: 1,
    createdAt: new Date().toISOString(),
    createdBy: user?.id || 'anonymous',
  }] : notes;

  const handleUpdateNote = async (updatedNote: Note) => {
    if (updatedNote.id === 'placeholder' && notes.length === 0) {
      try {
        const newNote = await noteService.createNote({
          title: updatedNote.title,
          content: updatedNote.content,
          category: updatedNote.category,
          color: updatedNote.color,
          grid_x: updatedNote.gridX,
          grid_y: updatedNote.gridY,
          grid_width: updatedNote.gridWidth,
          grid_height: updatedNote.gridHeight,
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

        setNotes([mappedNote]);
      } catch (error) {
        console.error('Error creating note:', error);
      }
    } else {
      setNotes(notes.map(note =>
        note.id === updatedNote.id ? updatedNote : note
      ));

      try {
        await noteService.updateNote(updatedNote.id as string, {
          title: updatedNote.title,
          content: updatedNote.content,
          category: updatedNote.category,
          color: updatedNote.color,
          grid_x: updatedNote.gridX,
          grid_y: updatedNote.gridY,
          grid_width: updatedNote.gridWidth,
          grid_height: updatedNote.gridHeight,
          minimized: updatedNote.minimized,
        });
      } catch (error) {
        console.error('Error updating note:', error);
      }
    }
  };

  const handleDeleteNote = async (id: number | string) => {
    if (id === 'placeholder' && notes.length === 0) {
      return;
    }

    setNotes(notes.filter(note => note.id !== id));

    try {
      await noteService.deleteNote(id as string);
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  const handleMinimizeNote = async (id: number | string) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    const newMinimized = !note.minimized;

    setNotes(notes.map(n =>
      n.id === id ? { ...n, minimized: newMinimized } : n
    ));

    try {
      await noteService.toggleNoteMinimized(id as string, newMinimized);
    } catch (error) {
      console.error('Error toggling minimize:', error);
    }
  };

  const isPositionOccupied = (x: number, y: number, width: number, height: number, excludeNoteId?: number | string) => {
    return notes.some(
      note =>
        note.id !== excludeNoteId &&
        !(
          x + width <= note.gridX ||
          x >= note.gridX + note.gridWidth ||
          y + height <= note.gridY ||
          y >= note.gridY + note.gridHeight
        )
    );
  };

  const handleDragStart = (e: React.DragEvent, noteId: number | string) => {
    setDraggedNoteId(noteId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', noteId.toString());
  };

  const handleDragEnd = () => {
    setDraggedNoteId(null);
    setDragOverPosition(null);
  };

  const getGridPositionFromMouse = (e: React.MouseEvent, containerRect: DOMRect) => {
    const relativeX = e.clientX - containerRect.left;
    const relativeY = e.clientY - containerRect.top + (e.currentTarget as HTMLElement).scrollTop;

    const cellWidth = (containerRect.width - GRID_GAP * (GRID_COLUMNS - 1)) / GRID_COLUMNS;
    const cellHeight = 280;

    const gridX = Math.floor(relativeX / (cellWidth + GRID_GAP));
    const gridY = Math.floor(relativeY / (cellHeight + GRID_GAP));

    return {
      x: Math.max(0, Math.min(gridX, GRID_COLUMNS - 1)),
      y: Math.max(0, gridY),
    };
  };

  const handleGridDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const container = e.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    const position = getGridPositionFromMouse(e, rect);

    setDragOverPosition(position);
  };

  const handleGridDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (draggedNoteId === null || !dragOverPosition) {
      setDraggedNoteId(null);
      setDragOverPosition(null);
      return;
    }

    const draggedNote = notes.find(note => note.id === draggedNoteId);
    if (!draggedNote) {
      setDraggedNoteId(null);
      setDragOverPosition(null);
      return;
    }

    const newX = Math.min(dragOverPosition.x, GRID_COLUMNS - draggedNote.gridWidth);
    const newY = dragOverPosition.y;

    if (!isPositionOccupied(newX, newY, draggedNote.gridWidth, draggedNote.gridHeight, draggedNoteId)) {
      setNotes(notes.map(note =>
        note.id === draggedNoteId
          ? { ...note, gridX: newX, gridY: newY }
          : note
      ));

      try {
        await noteService.updateNotePosition(draggedNoteId as string, newX, newY);
      } catch (error) {
        console.error('Error updating note position:', error);
      }
    }

    setDraggedNoteId(null);
    setDragOverPosition(null);
  };

  if (isLoading) {
    return (
      <div className="mt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-charcoal uppercase">Notes</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <span className="ml-2 text-gray-500">Loading notes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium uppercase" style={{ color: 'var(--t1)' }}>Notes</h2>
        <div className="flex items-center gap-4">
          {canEdit && (
            <button
              onClick={handleAddNote}
              className="flex items-center gap-2 text-sm text-primary hover:text-black"
            >
              <Plus className="w-4 h-4" />
              Add Note
            </button>
          )}
          <button
            onClick={() => window.location.href = '/notes'}
            className="flex items-center gap-2 text-sm text-primary hover:text-black"
          >
            View All Notes
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div
        className="relative"
        onDragOver={handleGridDragOver}
        onDrop={handleGridDrop}
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${GRID_COLUMNS}, 1fr)`,
          gap: `${GRID_GAP}px`,
          gridAutoRows: '280px',
          minHeight: '280px',
        }}
      >
        {dragOverPosition && draggedNoteId && (
          <div
            className="absolute border-2 border-dashed border-primary bg-primary/10 pointer-events-none"
            style={{
              gridColumn: `${dragOverPosition.x + 1} / span ${notes.find(n => n.id === draggedNoteId)?.gridWidth || 1}`,
              gridRow: `${dragOverPosition.y + 1} / span ${notes.find(n => n.id === draggedNoteId)?.gridHeight || 1}`,
            }}
          />
        )}
        {displayNotes.map(note => {
          const isResizing = resizingNote?.id === note.id;
          const displayWidth = isResizing ? resizingNote.width : note.gridWidth;
          const displayHeight = isResizing ? resizingNote.height : note.gridHeight;

          return (
            <div
              key={note.id}
              style={{
                gridColumn: `${note.gridX + 1} / span ${displayWidth}`,
                gridRow: `${note.gridY + 1} / span ${displayHeight}`,
              }}
            >
              <NoteEditor
                note={{ ...note, id: typeof note.id === 'string' ? parseInt(note.id, 10) || 0 : note.id } as NoteType}
                onUpdate={(updatedNote) => handleUpdateNote({ ...updatedNote, id: note.id })}
                onDelete={() => handleDeleteNote(note.id)}
                onMinimize={() => handleMinimizeNote(note.id)}
                onResize={async (width, height) => {
                  if (!isPositionOccupied(note.gridX, note.gridY, width, height, note.id)) {
                    handleUpdateNote({ ...note, gridWidth: width, gridHeight: height });
                  }
                  setResizingNote(null);
                }}
                onResizing={(width, height) => {
                  setResizingNote({ id: note.id, width, height });
                }}
                readOnly={!canEdit}
                onDragStart={(e) => handleDragStart(e, note.id)}
                onDragEnd={handleDragEnd}
                isDragging={draggedNoteId === note.id}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
