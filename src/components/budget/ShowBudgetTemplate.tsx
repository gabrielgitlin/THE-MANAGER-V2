import React, { useState, useEffect } from 'react';
import { DollarSign, Plus, X, Calendar, MapPin, Users, Music, Truck, Building, Coffee, Lightbulb, Mic, Speaker, Camera, Wifi, FileText } from 'lucide-react';
import type { Budget, BudgetCategory, BudgetType } from '../../types';
import { CREW_MEMBERS } from '../../data/logistics';

interface ShowBudgetTemplateProps {
  onApply: (template: Partial<Budget>) => void;
  onCancel: () => void;
  showId?: number;
}

// Default budget categories for live shows
const DEFAULT_CATEGORIES = [
  { id: 'personnel', name: 'Personnel', description: 'Crew and staff payments', color: '#A58A67' },
  { id: 'production', name: 'Production', description: 'Sound, lighting, and stage equipment', color: '#6E6A67' },
  { id: 'venue', name: 'Venue', description: 'Venue rental and related costs', color: '#C6B08F' },
  { id: 'travel', name: 'Travel', description: 'Transportation and logistics', color: '#D8C9B1' },
  { id: 'accommodation', name: 'Accommodation', description: 'Hotels and lodging', color: '#EBE2D3' },
  { id: 'marketing', name: 'Marketing', description: 'Promotion and advertising', color: '#86817D' },
  { id: 'catering', name: 'Catering', description: 'Food and beverages', color: '#F5F0E8' },
  { id: 'insurance', name: 'Insurance', description: 'Event insurance and liability coverage', color: '#FAF7F3' },
  { id: 'other', name: 'Other', description: 'Miscellaneous expenses', color: '#E9E6E4' },
];

// Default budget items for live shows
const DEFAULT_BUDGET_ITEMS = [
  // Personnel
  { category: 'Personnel', description: 'Sound Engineer', amount: 350 },
  { category: 'Personnel', description: 'Lighting Technician', amount: 300 },
  { category: 'Personnel', description: 'Stage Hands', amount: 500 },
  { category: 'Personnel', description: 'Security', amount: 450 },
  { category: 'Personnel', description: 'Tour Manager', amount: 0 },
  { category: 'Personnel', description: 'Production Manager', amount: 0 },
  
  // Production
  { category: 'Production', description: 'Sound System Rental', amount: 1200 },
  { category: 'Production', description: 'Lighting Equipment', amount: 800 },
  { category: 'Production', description: 'Stage Setup', amount: 500 },
  { category: 'Production', description: 'Backline Rental', amount: 600 },
  { category: 'Production', description: 'Power Generator', amount: 300 },
  
  // Venue
  { category: 'Venue', description: 'Venue Rental', amount: 2500 },
  { category: 'Venue', description: 'Permits and Licenses', amount: 350 },
  { category: 'Venue', description: 'Cleaning Fee', amount: 200 },
  { category: 'Venue', description: 'Security Deposit', amount: 1000 },
  
  // Travel
  { category: 'Travel', description: 'Flights', amount: 1500 },
  { category: 'Travel', description: 'Ground Transportation', amount: 400 },
  { category: 'Travel', description: 'Equipment Transport', amount: 800 },
  { category: 'Travel', description: 'Parking', amount: 100 },
  
  // Accommodation
  { category: 'Accommodation', description: 'Hotel Rooms', amount: 1200 },
  { category: 'Accommodation', description: 'Per Diems', amount: 500 },
  
  // Marketing
  { category: 'Marketing', description: 'Posters and Flyers', amount: 300 },
  { category: 'Marketing', description: 'Social Media Ads', amount: 500 },
  { category: 'Marketing', description: 'Radio Spots', amount: 400 },
  { category: 'Marketing', description: 'Photographer', amount: 250 },
  
  // Catering
  { category: 'Catering', description: 'Crew Meals', amount: 400 },
  { category: 'Catering', description: 'Artist Hospitality', amount: 300 },
  { category: 'Catering', description: 'Drinks and Snacks', amount: 200 },
  
  // Insurance
  { category: 'Insurance', description: 'Event Insurance', amount: 500 },
  { category: 'Insurance', description: 'Equipment Insurance', amount: 300 },
  
  // Other
  { category: 'Other', description: 'Contingency (10%)', amount: 1500 },
  { category: 'Other', description: 'Miscellaneous', amount: 500 },
];

export default function ShowBudgetTemplate({ onApply, onCancel, showId }: ShowBudgetTemplateProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    DEFAULT_CATEGORIES.map(cat => cat.id)
  );
  
  const [budgetItems, setBudgetItems] = useState(DEFAULT_BUDGET_ITEMS);
  const [showName, setShowName] = useState('');
  const [showDate, setShowDate] = useState('');
  const [showVenue, setShowVenue] = useState('');
  const [showCity, setShowCity] = useState('');
  
  // Calculate totals by category
  const categoryTotals = budgetItems.reduce((acc, item) => {
    const category = item.category;
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += item.amount;
    return acc;
  }, {} as Record<string, number>);
  
  const totalBudget = Object.values(categoryTotals).reduce((sum, amount) => sum + amount, 0);
  
  const handleToggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };
  
  const handleUpdateItemAmount = (index: number, amount: number) => {
    const updatedItems = [...budgetItems];
    updatedItems[index] = { ...updatedItems[index], amount };
    setBudgetItems(updatedItems);
  };
  
  const handleRemoveItem = (index: number) => {
    setBudgetItems(budgetItems.filter((_, i) => i !== index));
  };
  
  const handleAddItem = (category: string) => {
    setBudgetItems([
      ...budgetItems,
      { category, description: '', amount: 0 }
    ]);
  };
  
  const handleApplyTemplate = () => {
    // Create category budgets from selected categories
    const categoryBudgets = DEFAULT_CATEGORIES
      .filter(cat => selectedCategories.includes(cat.id))
      .map(cat => ({
        category: cat.name as BudgetCategory,
        budgetAmount: categoryTotals[cat.name] || 0,
      }));
    
    // Create budget items from selected items
    const filteredBudgetItems = budgetItems.filter(item => 
      DEFAULT_CATEGORIES.some(cat => 
        cat.name === item.category && selectedCategories.includes(cat.id)
      )
    ).map((item, index) => ({
      id: index + 1,
      date: new Date().toISOString().split('T')[0],
      description: item.description,
      type: 'Expense' as const,
      amount: item.amount,
      category: item.category as BudgetCategory,
      status: 'unpaid' as const,
    }));
    
    // Create the budget template
    const budgetTemplate: Partial<Budget> = {
      type: 'show',
      title: showName || 'New Show Budget',
      artist: 'Led Zeppelin',
      status: 'planning',
      date: showDate || new Date().toISOString().split('T')[0],
      venue: showVenue || '',
      city: showCity || '',
      budgetItems: filteredBudgetItems,
      categoryBudgets,
    };
    
    onApply(budgetTemplate);
  };
  
  // Get personnel fees from crew members if a show ID is provided
  const getPersonnelFees = () => {
    if (!showId) return 0;
    
    return CREW_MEMBERS.reduce((total, member) => {
      // Skip managers
      if (member.role === 'tour_manager' || member.role === 'production_manager') {
        return total;
      }
      
      // Find the show in the member's shows
      const show = member.shows?.find(s => s.name.includes(showId.toString()));
      if (show?.fee) {
        return total + show.fee;
      }
      
      return total;
    }, 0);
  };
  
  // Update personnel fees if a show ID is provided
  React.useEffect(() => {
    if (showId) {
      const personnelFees = getPersonnelFees();
      if (personnelFees > 0) {
        // Update the Personnel category with actual fees
        setBudgetItems(items => 
          items.map(item => 
            item.category === 'Personnel' && item.description === 'Sound Engineer' ? 
            { ...item, description: 'Crew Fees (from Personnel)', amount: personnelFees } : 
            item
          )
        );
      }
    }
  }, [showId]);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Personnel':
        return <Users className="w-5 h-5" />;
      case 'Production':
        return <Mic className="w-5 h-5" />;
      case 'Venue':
        return <Building className="w-5 h-5" />;
      case 'Travel':
        return <Truck className="w-5 h-5" />;
      case 'Accommodation':
        return <Building className="w-5 h-5" />;
      case 'Marketing':
        return <Camera className="w-5 h-5" />;
      case 'Catering':
        return <Coffee className="w-5 h-5" />;
      case 'Insurance':
        return <FileText className="w-5 h-5" />;
      default:
        return <FileText className="w-5 h-5" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium text-charcoal mb-4">Live Show Budget Template</h2>
        <p className="text-sm text-gray-500">
          This template includes common budget categories and items for live shows. 
          Customize it to fit your specific needs.
        </p>
      </div>
      
      {/* Show Details */}
      <div className="bg-beige p-4 rounded-lg">
        <h3 className="text-sm font-medium text-charcoal mb-3">Show Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Show Name
            </label>
            <input
              type="text"
              value={showName}
              onChange={(e) => setShowName(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              placeholder="e.g., Summer Tour 2025"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              value={showDate}
              onChange={(e) => setShowDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Venue
            </label>
            <input
              type="text"
              value={showVenue}
              onChange={(e) => setShowVenue(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              placeholder="e.g., Madison Square Garden"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              City
            </label>
            <input
              type="text"
              value={showCity}
              onChange={(e) => setShowCity(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              placeholder="e.g., New York"
            />
          </div>
        </div>
      </div>
      
      {/* Budget Categories */}
      <div>
        <h3 className="text-sm font-medium text-charcoal mb-3">Budget Categories</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {DEFAULT_CATEGORIES.map(category => (
            <div
              key={category.id}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                selectedCategories.includes(category.id)
                  ? 'border-primary bg-beige'
                  : 'border-gray-200 hover:border-gray'
              }`}
              onClick={() => handleToggleCategory(category.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full" style={{ backgroundColor: `${category.color}20` }}>
                    {getCategoryIcon(category.name)}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-charcoal">{category.name}</h4>
                    <p className="text-xs text-gray-500">{category.description}</p>
                  </div>
                </div>
                <div className="text-sm font-medium text-black">
                  ${categoryTotals[category.name] || 0}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Budget Items */}
      <div>
        <h3 className="text-sm font-medium text-charcoal mb-3">Budget Items</h3>
        
        {DEFAULT_CATEGORIES.filter(cat => selectedCategories.includes(cat.id)).map(category => (
          <div key={category.id} className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium text-gray-700">{category.name}</h4>
              <button
                type="button"
                onClick={() => handleAddItem(category.name)}
                className="text-xs text-primary hover:text-black flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Item
              </button>
            </div>
            
            <div className="space-y-2">
              {budgetItems
                .filter(item => item.category === category.name)
                .map((item, index) => {
                  const itemIndex = budgetItems.indexOf(item);
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <input
                          type="text"
                          value={item.description}
                          onChange={(e) => {
                            const updatedItems = [...budgetItems];
                            updatedItems[itemIndex] = { ...item, description: e.target.value };
                            setBudgetItems(updatedItems);
                          }}
                          className="block w-full bg-transparent border-none focus:ring-0 text-sm"
                          placeholder="Description"
                        />
                      </div>
                      <div className="w-32 relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                        </div>
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) => handleUpdateItemAmount(itemIndex, Number(e.target.value))}
                          className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                          min="0"
                          step="10"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(itemIndex)}
                        className="p-1 text-gray-400 hover:text-red-500"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
      
      {/* Total Budget */}
      <div className="bg-beige p-4 rounded-lg">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium text-charcoal">Total Budget</h3>
          <span className="text-xl font-bold text-black">${totalBudget}</span>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleApplyTemplate}
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary"
        >
          Apply Template
        </button>
      </div>
    </div>
  );
}