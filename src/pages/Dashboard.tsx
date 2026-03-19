import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { hasPermission } from '../lib/permissions';
import NotesWidget from '../components/notes/NotesWidget';
import TodoList from '../components/dashboard/TodoList';
import Calculator from '../components/Calculator';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [showCalculator, setShowCalculator] = useState(false);

  // Check if user has permissions for different sections
  const canViewNotes = hasPermission(user, 'view_dashboard');
  const canViewTasks = hasPermission(user, 'view_dashboard');

  return (
    <div>
      <div className="mb-4 md:mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-charcoal font-title">DASHBOARD</h1>
          <p className="mt-0.5 md:mt-1 text-sm text-gray-500">
            Task management and notes
          </p>
        </div>
        <button
          onClick={() => setShowCalculator(!showCalculator)}
          className={`p-2.5 active:scale-95 transition-all ${
            showCalculator
              ? 'bg-charcoal'
              : 'hover:bg-gray-100 active:bg-gray-200'
          }`}
          title="Calculator"
        >
          <img
            src="/noun-calculator-6619201.svg"
            alt="Calculator"
            className={`w-7 h-7 md:w-8 md:h-8 ${showCalculator ? 'invert' : ''}`}
          />
        </button>
      </div>

      <Calculator isOpen={showCalculator} onClose={() => setShowCalculator(false)} />

      <div className="mb-4 md:mb-8">
        {canViewTasks ? (
          <TodoList />
        ) : (
          <div className="bg-gray-50 p-6 md:p-8 text-center">
            <p className="text-gray-500">You don't have permission to view tasks</p>
          </div>
        )}
      </div>

      <div>
        {canViewNotes ? (
          <NotesWidget />
        ) : (
          <div className="bg-gray-50 p-6 md:p-8 text-center">
            <p className="text-gray-500">You don't have permission to view notes</p>
          </div>
        )}
      </div>
    </div>
  );
}