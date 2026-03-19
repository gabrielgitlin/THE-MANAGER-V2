import React from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Palette, X, Maximize2, Minimize2, Download, GripVertical } from 'lucide-react';
import type { Note, NoteCategory } from '../../types';

interface NoteEditorProps {
  note: Note;
  onUpdate: (note: Note) => void;
  onDelete: (id: number) => void;
  onMinimize: (id: number) => void;
  onResize?: (width: number, height: number) => void;
  onResizing?: (width: number, height: number) => void;
  readOnly?: boolean;
  onDragStart?: (e: React.DragEvent, noteId: number) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}

export default function NoteEditor({
  note,
  onUpdate,
  onDelete,
  onMinimize,
  onResize,
  onResizing,
  readOnly = false,
  onDragStart,
  onDragEnd,
  isDragging = false
}: NoteEditorProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [content, setContent] = React.useState(note.content);
  const [isResizing, setIsResizing] = React.useState(false);
  const [resizeDirection, setResizeDirection] = React.useState<'width' | 'height' | 'both' | null>(null);
  const [resizeStart, setResizeStart] = React.useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [tempSize, setTempSize] = React.useState<{ width: number; height: number } | null>(null);
  const editorRef = React.useRef<HTMLDivElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleResizeStart = (e: React.MouseEvent, direction: 'width' | 'height' | 'both') => {
    if (readOnly || !onResize) return;
    e.stopPropagation();
    e.preventDefault();

    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: note.gridWidth,
      height: note.gridHeight,
    });
  };

  React.useEffect(() => {
    if (!isResizing || !resizeDirection || !resizeStart || !containerRef.current) return;

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();

      const container = containerRef.current;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      const cellWidth = rect.width / note.gridWidth;
      const cellHeight = rect.height / note.gridHeight;

      let newWidth = note.gridWidth;
      let newHeight = note.gridHeight;

      if (resizeDirection === 'width' || resizeDirection === 'both') {
        const deltaX = e.clientX - resizeStart.x;
        const cellsDelta = Math.round(deltaX / cellWidth);
        newWidth = Math.max(1, Math.min(6, resizeStart.width + cellsDelta));
      }

      if (resizeDirection === 'height' || resizeDirection === 'both') {
        const deltaY = e.clientY - resizeStart.y;
        const cellsDelta = Math.round(deltaY / cellHeight);
        newHeight = Math.max(1, resizeStart.height + cellsDelta);
      }

      setTempSize({ width: newWidth, height: newHeight });
      onResizing?.(newWidth, newHeight);
    };

    const handleMouseUp = () => {
      if (tempSize) {
        onResize?.(tempSize.width, tempSize.height);
      }
      setIsResizing(false);
      setResizeDirection(null);
      setResizeStart(null);
      setTempSize(null);
      onResizing?.(note.gridWidth, note.gridHeight);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeDirection, resizeStart, note.gridWidth, note.gridHeight, onResize, tempSize]);

  const colors = [
    'bg-beige',
    'bg-light-blue',
    'bg-primary/10',
    'bg-gray/20'
  ];

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      onUpdate({ ...note, content: editorRef.current.innerHTML });
    }
  };

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isEditing) {
      timer = setInterval(() => {
        if (editorRef.current && editorRef.current.innerHTML !== note.content) {
          onUpdate({ ...note, content: editorRef.current.innerHTML });
        }
      }, 30000); // Auto-save every 30 seconds
    }
    return () => clearInterval(timer);
  }, [isEditing, note, onUpdate]);

  const handleExport = (format: 'pdf' | 'txt') => {
    const content = editorRef.current?.innerText || '';
    if (format === 'txt') {
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `note-${note.id}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
    // PDF export would require a PDF library
  };

  return (
    <div
      ref={containerRef}
      draggable={!isEditing && !isResizing}
      onDragStart={(e) => {
        if (isEditing || isResizing) {
          e.preventDefault();
          return;
        }
        onDragStart?.(e, note.id);
      }}
      onDragEnd={() => onDragEnd?.()}
      className={`relative ${note.color || colors[0]} border border-black p-4 h-full ${
        isDragging ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
      } ${!isEditing && !isResizing ? 'cursor-move' : 'cursor-auto'} ${isResizing ? '' : 'transition-all'} flex flex-col`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {!isEditing && (
            <GripVertical
              className="w-4 h-4 text-gray-600 cursor-move flex-shrink-0"
              onMouseDown={(e) => e.stopPropagation()}
            />
          )}
          <input
            type="text"
            value={note.title || ''}
            onChange={(e) => onUpdate({ ...note, title: e.target.value })}
            placeholder="Note title..."
            className="text-lg bg-transparent border-none focus:ring-0 focus:outline-none flex-1 min-w-0 placeholder-gray-400"
            disabled={readOnly}
            draggable={false}
            onDragStart={(e) => e.preventDefault()}
          />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onMinimize(note.id)}
            className="p-1 hover:bg-black/5 rounded"
          >
            {note.minimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
          {!readOnly && (
            <button
              onClick={() => onDelete(note.id)}
              className="p-1 hover:bg-black/5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {!note.minimized && (
        <>
          {!readOnly && (
            <div className="flex items-center gap-1 mb-2 border-b pb-2">
              <button onClick={() => formatText('bold')} className="p-1 hover:bg-black/5 rounded">
                <Bold className="w-4 h-4" />
              </button>
              <button onClick={() => formatText('italic')} className="p-1 hover:bg-black/5 rounded">
                <Italic className="w-4 h-4" />
              </button>
              <button onClick={() => formatText('underline')} className="p-1 hover:bg-black/5 rounded">
                <Underline className="w-4 h-4" />
              </button>
              <button onClick={() => formatText('insertUnorderedList')} className="p-1 hover:bg-black/5 rounded">
                <List className="w-4 h-4" />
              </button>
              <button onClick={() => formatText('insertOrderedList')} className="p-1 hover:bg-black/5 rounded">
                <ListOrdered className="w-4 h-4" />
              </button>
              <div className="relative group">
                <button className="p-1 hover:bg-black/5 rounded">
                  <Palette className="w-4 h-4" />
                </button>
                <div className="absolute hidden group-hover:flex gap-1 bg-white p-1 rounded shadow-lg">
                  {colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => onUpdate({ ...note, color })}
                      className={`w-6 h-6 rounded ${color}`}
                    />
                  ))}
                </div>
              </div>
              <div className="relative group ml-auto">
                <button className="p-1 hover:bg-black/5 rounded">
                  <Download className="w-4 h-4" />
                </button>
                <div className="absolute right-0 hidden group-hover:flex flex-col bg-white p-1 rounded shadow-lg">
                  <button
                    onClick={() => handleExport('txt')}
                    className="px-2 py-1 hover:bg-gray-100 text-sm text-left whitespace-nowrap"
                  >
                    Export as TXT
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="px-2 py-1 hover:bg-gray-100 text-sm text-left whitespace-nowrap"
                  >
                    Export as PDF
                  </button>
                </div>
              </div>
            </div>
          )}

          <div
            ref={editorRef}
            contentEditable={!readOnly}
            draggable={false}
            onFocus={() => setIsEditing(true)}
            onBlur={() => {
              setIsEditing(false);
              if (editorRef.current) {
                onUpdate({ ...note, content: editorRef.current.innerHTML });
              }
            }}
            dangerouslySetInnerHTML={{ __html: note.content }}
            className="flex-1 overflow-y-auto focus:outline-none"
            onInput={(e) => {
              const text = (e.target as HTMLDivElement).innerText;
              if (text.length > 1000) {
                e.preventDefault();
                (e.target as HTMLDivElement).innerHTML = content;
              } else {
                setContent((e.target as HTMLDivElement).innerHTML);
              }
            }}
            onDragStart={(e) => e.preventDefault()}
          />
        </>
      )}

      {!readOnly && onResize && (
        <>
          <div
            className={`absolute right-0 top-0 bottom-0 w-2 cursor-ew-resize transition-opacity ${
              isResizing && resizeDirection === 'width' ? 'opacity-100' : 'opacity-0 hover:opacity-100'
            }`}
            onMouseDown={(e) => handleResizeStart(e, 'width')}
            title="Drag to resize width"
          >
            <div className="absolute inset-0 bg-black/20"></div>
          </div>

          <div
            className={`absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize transition-opacity ${
              isResizing && resizeDirection === 'height' ? 'opacity-100' : 'opacity-0 hover:opacity-100'
            }`}
            onMouseDown={(e) => handleResizeStart(e, 'height')}
            title="Drag to resize height"
          >
            <div className="absolute inset-0 bg-black/20"></div>
          </div>

          <div
            className={`absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize transition-opacity z-10 ${
              isResizing && resizeDirection === 'both' ? 'opacity-100' : 'opacity-0 hover:opacity-100'
            }`}
            onMouseDown={(e) => handleResizeStart(e, 'both')}
            title="Drag to resize both"
          >
            <div className="absolute inset-0 bg-black/30 rounded-tl"></div>
          </div>

          {isResizing && tempSize && (
            <div className="absolute top-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded z-20 pointer-events-none">
              {tempSize.width}×{tempSize.height}
            </div>
          )}
        </>
      )}
    </div>
  );
}