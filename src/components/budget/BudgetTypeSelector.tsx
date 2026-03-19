import React from 'react';
import { Music, Mic, MapPin } from 'lucide-react';
import type { BudgetType } from '../../types';

interface BudgetTypeSelectorProps {
  onSelect: (type: BudgetType) => void;
}

export default function BudgetTypeSelector({ onSelect }: BudgetTypeSelectorProps) {
  const budgetTypes = [
    {
      type: 'release' as BudgetType,
      icon: Music,
      title: 'Release Budget',
      description: 'Create budget for singles, EPs, or albums',
    },
    {
      type: 'show' as BudgetType,
      icon: Mic,
      title: 'Show Budget',
      description: 'Budget for individual shows',
    },
    {
      type: 'tour' as BudgetType,
      icon: MapPin,
      title: 'Tour Budget',
      description: 'Budget for multiple shows and tour expenses',
    },
  ];

  const [selectedType, setSelectedType] = React.useState<BudgetType | null>(null);
  const [showTemplateSelection, setShowTemplateSelection] = React.useState(false);

  const handleTypeSelect = (type: BudgetType) => {
    setSelectedType(type);
    setShowTemplateSelection(true);
  };

  if (showTemplateSelection && selectedType) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-charcoal uppercase">Choose a Starting Point</h3>
          <button
            onClick={() => setShowTemplateSelection(false)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => onSelect(selectedType)}
            className="flex items-start gap-4 p-6 text-left border rounded-lg hover:border-primary hover:bg-beige transition-colors w-full"
          >
            <div className="flex-shrink-0 p-3 bg-beige rounded-lg">
              <Music className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-charcoal">Start from Scratch</h3>
              <p className="text-sm text-gray-500">Create a new budget with no predefined items</p>
            </div>
          </button>

          <button
            onClick={() => {
              // This will be handled when you provide the templates
              onSelect(selectedType);
            }}
            className="flex items-start gap-4 p-6 text-left border rounded-lg hover:border-primary hover:bg-beige transition-colors w-full"
          >
            <div className="flex-shrink-0 p-3 bg-beige rounded-lg">
              <Music className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-medium text-charcoal">Use a Template</h3>
              <p className="text-sm text-gray-500">Start with a predefined budget structure</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {budgetTypes.map(({ type, icon: Icon, title, description }) => (
        <button
          key={type}
          onClick={() => handleTypeSelect(type)}
          className="flex flex-col items-start p-6 text-left border rounded-lg hover:border-primary hover:bg-beige transition-colors h-full"
        >
          <div className="flex-shrink-0 p-3 bg-beige rounded-lg mb-4">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <div className="min-w-0 w-full">
            <h3 className="font-medium text-charcoal mb-2">{title}</h3>
            <p className="text-sm text-gray-500 break-words">{description}</p>
          </div>
        </button>
      ))}
    </div>
  );
}