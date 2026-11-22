import { useState, useEffect, useRef } from 'react';
import { Plus, X, Calendar as CalIcon, Loader2 } from 'lucide-react';
import { TMDatePicker } from '../ui/TMDatePicker';
import * as taskService from '../../lib/taskService';
import type { Task } from '../../lib/taskService';

const PRIORITY_DOT: Record<string, string> = {
  High: 'var(--status-red)',
  Medium: 'var(--status-yellow)',
  Low: 'var(--status-green)',
};

export default function TasksWidget() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [newDueDate, setNewDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchTasks(); }, []);
  useEffect(() => { if (adding) inputRef.current?.focus(); }, [adding]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const data = await taskService.getTasks();
      setTasks(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTitle.trim() || saving) return;
    setSaving(true);
    try {
      const task = await taskService.createTask({
        title: newTitle.trim(),
        priority: newPriority,
        due_date: newDueDate || undefined,
      });
      setTasks(prev => [task, ...prev]);
      setNewTitle('');
      setNewDueDate('');
      setNewPriority('Medium');
      setAdding(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const toggleComplete = async (task: Task) => {
    const updated = { ...task, completed: !task.completed };
    setTasks(prev => prev.map(t => t.id === task.id ? updated : t));
    try {
      await taskService.toggleTaskComplete(task.id, !task.completed);
    } catch (e) {
      setTasks(prev => prev.map(t => t.id === task.id ? task : t));
    }
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await taskService.deleteTask(id);
    } catch (e) {
      fetchTasks();
    }
  };

  const pending = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);
  const sortedPending = [...pending].sort((a, b) => {
    const p = { High: 0, Medium: 1, Low: 2 };
    return p[a.priority] - p[b.priority];
  });

  const formatDue = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diff = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { text: `${Math.abs(diff)}d late`, color: 'var(--status-red)' };
    if (diff === 0) return { text: 'Today', color: 'var(--status-yellow)' };
    if (diff === 1) return { text: 'Tomorrow', color: 'var(--status-yellow)' };
    if (diff <= 7) return { text: `${diff}d`, color: 'var(--t3)' };
    return { text: d.toLocaleDateString('en', { month: 'short', day: 'numeric' }), color: 'var(--t3)' };
  };

  return (
    <div className="tm-card" style={{ minHeight: 200 }}>
      {/* Header */}
      <div className="tm-card-header">
        <div className="flex items-center gap-2">
          <img src="/TM-Pin-negro.png" alt="" style={{ width: 16, height: 16, filter: 'invert(1)', opacity: 0.4 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--t1)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Tasks
          </span>
          {pending.length > 0 && (
            <span style={{ fontSize: 11, color: 'var(--t3)', marginLeft: 4 }}>{pending.length}</span>
          )}
        </div>
        <button
          onClick={() => setAdding(!adding)}
          className="btn-icon sm"
          style={{ color: adding ? 'var(--status-red)' : 'var(--brand-1)' }}
        >
          {adding ? <X size={16} /> : <Plus size={16} />}
        </button>
      </div>

      {/* Add form */}
      {adding && (
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
          <div className="flex items-center gap-2 mb-2">
            <input
              ref={inputRef}
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addTask()}
              placeholder="What needs to be done?"
              style={{ flex: 1, height: 36, fontSize: 13 }}
            />
          </div>
          <div className="flex items-center gap-3">
            {/* Priority selector */}
            <div className="flex items-center gap-1">
              {(['High', 'Medium', 'Low'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setNewPriority(p)}
                  style={{
                    width: 24, height: 24, borderRadius: '50%',
                    border: newPriority === p ? `2px solid ${PRIORITY_DOT[p]}` : '2px solid transparent',
                    background: 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                  title={p}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: PRIORITY_DOT[p] }} />
                </button>
              ))}
            </div>
            {/* Due date */}
            <TMDatePicker
              value={newDueDate}
              onChange={(date) => setNewDueDate(date)}
            />
            <div style={{ flex: 1 }} />
            <button onClick={addTask} className="btn btn-primary btn-sm" disabled={!newTitle.trim() || saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* Task list */}
      <div style={{ maxHeight: 420, overflowY: 'auto' }}>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin" style={{ color: 'var(--t3)' }} />
          </div>
        ) : sortedPending.length === 0 && !adding ? (
          <div className="empty-state" style={{ padding: '32px 20px' }}>
            <img src="/TM-Pin-negro.png" alt="" className="empty-state-icon" style={{ width: 40, height: 40 }} />
            <div className="empty-state-title">No pending tasks</div>
            <div className="empty-state-desc">Click + to add your first task</div>
          </div>
        ) : (
          <>
            {sortedPending.map(task => (
              <TaskRow key={task.id} task={task} onToggle={toggleComplete} onDelete={deleteTask} formatDue={formatDue} />
            ))}
            {completed.length > 0 && (
              <details style={{ borderTop: '1px solid var(--border)' }}>
                <summary
                  style={{
                    padding: '10px 20px', fontSize: 11, color: 'var(--t3)', cursor: 'pointer',
                    textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500,
                    listStyle: 'none', display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <img src="/The Manager_Iconografia-11.svg" className="pxi-sm" alt="" /> Completed ({completed.length})
                </summary>
                {completed.slice(0, 10).map(task => (
                  <TaskRow key={task.id} task={task} onToggle={toggleComplete} onDelete={deleteTask} formatDue={formatDue} />
                ))}
              </details>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function TaskRow({
  task,
  onToggle,
  onDelete,
  formatDue,
}: {
  task: Task;
  onToggle: (t: Task) => void;
  onDelete: (id: string) => void;
  formatDue: (d: string) => { text: string; color: string };
}) {
  const due = task.due_date ? formatDue(task.due_date) : null;

  return (
    <div
      className="group flex items-center gap-3"
      style={{
        padding: '10px 20px',
        borderBottom: '1px solid var(--border)',
        opacity: task.completed ? 0.45 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      {/* Priority dot + checkbox */}
      <button
        onClick={() => onToggle(task)}
        style={{
          width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
          border: `2px solid ${task.completed ? 'var(--brand-1)' : PRIORITY_DOT[task.priority]}`,
          background: task.completed ? 'var(--brand-1)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        {task.completed && <img src="/The Manager_Iconografia-11.svg" className="pxi-sm" alt="" />}
      </button>

      {/* Title */}
      <span
        style={{
          flex: 1, fontSize: 13, color: task.completed ? 'var(--t3)' : 'var(--t1)',
          textDecoration: task.completed ? 'line-through' : 'none',
          lineHeight: 1.3,
        }}
      >
        {task.title}
      </span>

      {/* Due date */}
      {due && !task.completed && (
        <span className="flex items-center gap-1" style={{ fontSize: 11, color: due.color, flexShrink: 0 }}>
          <CalIcon size={11} />
          {due.text}
        </span>
      )}

      {/* Delete */}
      <button
        onClick={() => onDelete(task.id)}
        className="btn-icon sm"
        style={{ opacity: 0, transition: 'opacity 0.1s', color: 'var(--t3)' }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
      >
        <img src="/TM-Trash-negro.svg" className="pxi-sm icon-danger" alt="" />
      </button>
    </div>
  );
}
