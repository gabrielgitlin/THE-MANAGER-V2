import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import type { Budget, BudgetType, Track, BudgetCategory } from '../../types';
import ShowBudgetTemplate from './ShowBudgetTemplate';
import CatalogSelector from './CatalogSelector';

// Default categories
const DEFAULT_CATEGORIES: BudgetCategory[] = ['Art', 'Digital', 'Marketing', 'Music', 'Press', 'Other'];

interface BudgetFormProps {
  type: BudgetType;
  onSubmit: (budget: Partial<Budget>) => void;
  onCancel: () => void;
  tracks?: Track[];
  shows?: any[];
  budgets: Budget[];
  showId?: number;
}

interface NewTrack {
  tempId: string;
  title: string;
  duration?: string;
  isrc?: string;
}

export default function BudgetForm({ type, onSubmit, onCancel, tracks, shows, budgets, showId }: BudgetFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    description: '',
    releaseType: 'single',
    releaseDate: '',
    startDate: '',
    endDate: '',
    venue: '',
    city: '',
    selectedTracks: [] as number[],
    selectedShows: [] as number[],
  });

  const [newTracks, setNewTracks] = useState<NewTrack[]>([]);

  const [categories, setCategories] = useState<BudgetCategory[]>(DEFAULT_CATEGORIES);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState<Partial<BudgetCategory>>({
    name: '',
    description: '',
    color: '#' + Math.floor(Math.random()*16777215).toString(16),
  });
  const [useTemplate, setUseTemplate] = useState(false);

  // If showId is provided, pre-fill the form with show data
  useEffect(() => {
    if (showId && shows) {
      const show = shows.find(s => s.id === showId);
      if (show) {
        setFormData(prev => ({
          ...prev,
          title: `${show.title} Budget`,
          venue: show.venue,
          city: show.city,
          startDate: show.date,
        }));
      }
    }
  }, [showId, shows]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const baseData = {
      title: formData.title,
      artist: formData.artist,
      status: 'planning',
      budgetItems: [],
      categoryBudgets: categories.map(cat => ({
        category: cat,
        budgetAmount: 0,
      })),
    };

    let budgetData: Partial<Budget>;

    switch (type) {
      case 'release':
        budgetData = {
          ...baseData,
          type: 'release',
          releaseType: formData.releaseType as 'single' | 'ep' | 'album',
          releaseDate: formData.releaseDate,
          tracks: formData.selectedTracks,
          newTracks: newTracks.length > 0 ? newTracks : undefined,
        };
        break;

      case 'show':
        budgetData = {
          ...baseData,
          type: 'show',
          date: formData.startDate,
          venue: formData.venue,
          city: formData.city,
        };
        break;

      case 'tour':
        budgetData = {
          ...baseData,
          type: 'tour',
          startDate: formData.startDate,
          endDate: formData.endDate,
          shows: formData.selectedShows,
        };
        break;

      default:
        return;
    }

    onSubmit(budgetData);
    
    // Navigate to the budget details page after creation
    const newBudgetId = Math.max(0, ...budgets.map(b => b.id)) + 1;
    navigate(`/finance/${newBudgetId}`);
  };

  const handleAddCategory = () => {
    if (!newCategory.name) return;

    const id = newCategory.name.toLowerCase().replace(/\s+/g, '_');
    const category = newCategory.name as BudgetCategory;

    setCategories([...categories, category]);
    setNewCategory({ 
      name: '', 
      description: '', 
      color: '#' + Math.floor(Math.random()*16777215).toString(16) 
    });
    setIsAddingCategory(false);
  };

  const handleUpdateCategory = () => {
    if (!editingCategoryId || !newCategory.name) return;

    setCategories(categories.map(cat => 
      cat === editingCategoryId ? newCategory.name as BudgetCategory : cat
    ));
    setNewCategory({ 
      name: '', 
      description: '', 
      color: '#' + Math.floor(Math.random()*16777215).toString(16) 
    });
    setEditingCategoryId(null);
    setIsAddingCategory(false);
  };

  const handleEditCategory = (category: BudgetCategory) => {
    setNewCategory({ name: category });
    setEditingCategoryId(category);
    setIsAddingCategory(true);
  };

  const handleDeleteCategory = (category: BudgetCategory) => {
    setCategories(categories.filter(c => c !== category));
  };

  const handleCatalogSelectionChange = (trackIds: number[], updatedNewTracks?: NewTrack[]) => {
    setFormData({ ...formData, selectedTracks: trackIds });
    if (updatedNewTracks) {
      setNewTracks(updatedNewTracks);
    }
  };

  const handleApplyTemplate = (template: Partial<Budget>) => {
    if (!template) {
      console.error('Invalid template data received');
      return;
    }

    // Apply the template data to our form with safe defaults
    setFormData(prev => ({
      ...prev,
      title: template.title || prev.title,
      artist: template.artist || prev.artist,
      venue: template.venue || prev.venue,
      city: template.city || prev.city,
      startDate: template.date || prev.startDate,
    }));
    
    // Ensure template has required properties before submitting
    const safeTemplate: Partial<Budget> = {
      ...template,
      type: 'show',
      status: template.status || 'planning',
      budgetItems: Array.isArray(template.budgetItems) ? template.budgetItems : [],
      // Add null check and type guard for categoryBudgets
      categoryBudgets: Array.isArray(template.categoryBudgets) 
        ? template.categoryBudgets.map(cat => ({
            category: cat.category || 'Other',
            budgetAmount: typeof cat.budgetAmount === 'number' ? cat.budgetAmount : 0
          }))
        : categories.map(cat => ({
            category: cat,
            budgetAmount: 0
          }))
    };
    
    // Submit the template data
    onSubmit(safeTemplate);
    
    // Navigate to the budget details page after creation
    const newBudgetId = Math.max(0, ...budgets.map(b => b.id || 0)) + 1;
    navigate(`/finance/${newBudgetId}`);
  };

  if (useTemplate && type === 'show') {
    return (
      <ShowBudgetTemplate 
        onApply={handleApplyTemplate}
        onCancel={() => setUseTemplate(false)}
        showId={showId}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium" style={{ color: 'var(--t1)' }}>
            Title
          </label>
          <input
            type="text"
            id="title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="mt-1 block w-full border shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--t1)' }}
            required
          />
        </div>

        <div>
          <label htmlFor="artist" className="block text-sm font-medium" style={{ color: 'var(--t1)' }}>
            Artist
          </label>
          <input
            type="text"
            id="artist"
            value={formData.artist}
            onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
            className="mt-1 block w-full border shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--t1)' }}
            required
          />
        </div>
      </div>

      {type === 'release' && (
        <>
          <div>
            <label htmlFor="releaseType" className="block text-sm font-medium" style={{ color: 'var(--t1)' }}>
              Release Type
            </label>
            <select
              id="releaseType"
              value={formData.releaseType}
              onChange={(e) => setFormData({ ...formData, releaseType: e.target.value })}
              className="mt-1 block w-full border shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--t1)' }}
            >
              <option value="single">Single</option>
              <option value="ep">EP</option>
              <option value="album">Album</option>
            </select>
          </div>

          <div>
            <label htmlFor="releaseDate" className="block text-sm font-medium" style={{ color: 'var(--t1)' }}>
              Release Date
            </label>
            <input
              type="date"
              id="releaseDate"
              value={formData.releaseDate}
              onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
              className="mt-1 block w-full border shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--t1)' }}
            />
          </div>

          <CatalogSelector
            selectedTracks={formData.selectedTracks}
            onSelectionChange={handleCatalogSelectionChange}
            releaseType={formData.releaseType as 'single' | 'ep' | 'album'}
          />
        </>
      )}

      {type === 'show' && (
        <>
          <div>
            <label htmlFor="date" className="block text-sm font-medium" style={{ color: 'var(--t1)' }}>
              Show Date
            </label>
            <input
              type="date"
              id="date"
              value={formData.startDate}
              onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              className="mt-1 block w-full border shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--t1)' }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="venue" className="block text-sm font-medium" style={{ color: 'var(--t1)' }}>
                Venue
              </label>
              <input
                type="text"
                id="venue"
                value={formData.venue}
                onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                className="mt-1 block w-full border shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--t1)' }}
              />
            </div>

            <div>
              <label htmlFor="city" className="block text-sm font-medium" style={{ color: 'var(--t1)' }}>
                City
              </label>
              <input
                type="text"
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="mt-1 block w-full border shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--t1)' }}
              />
            </div>
          </div>

          <div className="p-4" style={{ background: 'var(--surface-2)' }}>
            <div className="flex items-center justify-between">
              <p className="text-sm" style={{ color: 'var(--t1)' }}>
                Use our live show budget template with pre-configured categories and common expense items.
              </p>
              <button
                type="button"
                onClick={() => setUseTemplate(true)}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:opacity-80"
              >
                Use Template
              </button>
            </div>
          </div>
        </>
      )}

      {type === 'tour' && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium" style={{ color: 'var(--t1)' }}>
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="mt-1 block w-full border shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--t1)' }}
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium" style={{ color: 'var(--t1)' }}>
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={formData.endDate}
                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                className="mt-1 block w-full border shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--t1)' }}
              />
            </div>
          </div>

          {shows && (
            <div>
              <label className="block text-sm font-medium" style={{ color: 'var(--t1)' }}>
                Select Shows
              </label>
              <div className="mt-1 space-y-2">
                {shows.map((show) => (
                  <label key={show.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.selectedShows.includes(show.id)}
                      onChange={(e) => {
                        const newShows = e.target.checked
                          ? [...formData.selectedShows, show.id]
                          : formData.selectedShows.filter(id => id !== show.id);
                        setFormData({ ...formData, selectedShows: newShows });
                      }}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="ml-2 text-sm" style={{ color: 'var(--t1)' }}>{show.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Budget Categories Section */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium" style={{ color: 'var(--t1)' }}>Budget Categories</h3>
          <button
            type="button"
            onClick={() => {
              setIsAddingCategory(true);
              setEditingCategoryId(null);
              setNewCategory({
                name: '',
                description: '',
                color: '#' + Math.floor(Math.random()*16777215).toString(16)
              });
            }}
            className="flex items-center gap-2 text-sm text-primary hover:opacity-80"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((category) => (
            <div
              key={category}
              className="p-4 border hover:opacity-80 transition-opacity relative group"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-sm font-medium" style={{ color: 'var(--t1)' }}>{category}</h4>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleEditCategory(category)}
                    className="p-1 hover:opacity-80"
                    style={{ color: 'var(--t2)' }}
                  >
                    <img src="/TM-Pluma-negro.png" className="pxi-md icon-muted" alt="" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCategory(category)}
                    className="p-1 hover:text-red-500"
                    style={{ color: 'var(--t2)' }}
                  >
                    <img src="/TM-Trash-negro.svg" className="pxi-md icon-danger" alt="" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Add/Edit Category Form */}
        {isAddingCategory && (
          <div className="mt-4 p-4 border" style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}>
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-sm font-medium" style={{ color: 'var(--t1)' }}>
                {editingCategoryId ? 'Edit Category' : 'New Category'}
              </h4>
              <button
                type="button"
                onClick={() => {
                  setIsAddingCategory(false);
                  setEditingCategoryId(null);
                  setNewCategory({
                    name: '',
                    description: '',
                    color: '#' + Math.floor(Math.random()*16777215).toString(16)
                  });
                }}
                className="hover:opacity-80"
                style={{ color: 'var(--t2)' }}
              >
                <img src="/TM-Close-negro.svg" className="pxi-md icon-muted" alt="" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium" style={{ color: 'var(--t1)' }}>
                  Category Name
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  className="mt-1 block w-full border shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  style={{ background: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--t1)' }}
                  placeholder="e.g., Studio Time"
                />
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingCategory(false);
                    setEditingCategoryId(null);
                    setNewCategory({
                      name: '',
                      description: '',
                      color: '#' + Math.floor(Math.random()*16777215).toString(16)
                    });
                  }}
                  className="px-3 py-1 text-sm hover:opacity-80"
                  style={{ color: 'var(--t1)', background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={editingCategoryId ? handleUpdateCategory : handleAddCategory}
                  className="px-3 py-1 text-sm text-white bg-primary hover:opacity-80"
                >
                  {editingCategoryId ? 'Update Category' : 'Add Category'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium border hover:opacity-80"
          style={{ color: 'var(--t1)', background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-primary hover:opacity-80"
        >
          Create Budget
        </button>
      </div>
    </form>
  );
}