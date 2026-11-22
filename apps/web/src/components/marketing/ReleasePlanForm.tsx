import React, { useState } from 'react';
import { X } from 'lucide-react';
import { TMDatePicker } from '../ui/TMDatePicker';

interface ReleasePlan {
  id?: number;
  title: string;
  releaseType: 'single' | 'ep' | 'album';
  artist: string;
  releaseDate: string;
  coverArtUrl?: string;
  trackId?: number;
  albumId?: number;
  distributionPlatforms: string[];
  marketingActivities: {
    preRelease: string[];
    releaseDay: string[];
    postRelease: string[];
  };
  targetAudience: string[];
  budget: number;
  goals: string[];
  notes?: string;
}

interface ReleasePlanFormProps {
  initialData?: ReleasePlan;
  onSubmit: (plan: ReleasePlan) => void;
  onCancel: () => void;
  catalog: any; // Replace with proper catalog type
}

export default function ReleasePlanForm({ initialData, onSubmit, onCancel, catalog }: ReleasePlanFormProps) {
  const [formData, setFormData] = useState<ReleasePlan>(initialData || {
    title: '',
    releaseType: 'single',
    artist: '',
    releaseDate: '',
    distributionPlatforms: [],
    marketingActivities: {
      preRelease: [],
      releaseDay: [],
      postRelease: [],
    },
    targetAudience: [],
    budget: 0,
    goals: [],
  });

  const [newPreReleaseActivity, setNewPreReleaseActivity] = useState('');
  const [newReleaseDayActivity, setNewReleaseDayActivity] = useState('');
  const [newPostReleaseActivity, setNewPostReleaseActivity] = useState('');
  const [newTargetAudience, setNewTargetAudience] = useState('');
  const [newGoal, setNewGoal] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleActivityAdd = (type: 'preRelease' | 'releaseDay' | 'postRelease', value: string) => {
    if (!value.trim()) return;

    setFormData({
      ...formData,
      marketingActivities: {
        ...formData.marketingActivities,
        [type]: [...formData.marketingActivities[type], value.trim()]
      }
    });

    // Reset the corresponding input
    switch (type) {
      case 'preRelease':
        setNewPreReleaseActivity('');
        break;
      case 'releaseDay':
        setNewReleaseDayActivity('');
        break;
      case 'postRelease':
        setNewPostReleaseActivity('');
        break;
    }
  };

  const handleActivityRemove = (type: 'preRelease' | 'releaseDay' | 'postRelease', index: number) => {
    setFormData({
      ...formData,
      marketingActivities: {
        ...formData.marketingActivities,
        [type]: formData.marketingActivities[type].filter((_, i) => i !== index)
      }
    });
  };

  const handleTargetAudienceAdd = () => {
    if (!newTargetAudience.trim()) return;
    setFormData({
      ...formData,
      targetAudience: [...formData.targetAudience, newTargetAudience.trim()]
    });
    setNewTargetAudience('');
  };

  const handleTargetAudienceRemove = (index: number) => {
    setFormData({
      ...formData,
      targetAudience: formData.targetAudience.filter((_, i) => i !== index)
    });
  };

  const handleGoalAdd = () => {
    if (!newGoal.trim()) return;
    setFormData({
      ...formData,
      goals: [...formData.goals, newGoal.trim()]
    });
    setNewGoal('');
  };

  const handleGoalRemove = (index: number) => {
    setFormData({
      ...formData,
      goals: formData.goals.filter((_, i) => i !== index)
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>Artist</label>
          <input
            type="text"
            value={formData.artist}
            onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
            className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium" style={{ color: 'var(--t2)' }}>Release Type</label>
          <select
            value={formData.releaseType}
            onChange={(e) => setFormData({ ...formData, releaseType: e.target.value as 'single' | 'ep' | 'album' })}
            className="mt-1 block w-full border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            style={{ background: 'var(--surface)', color: 'var(--t1)', borderColor: 'var(--border)' }}
            required
          >
            <option value="single">Single</option>
            <option value="ep">EP</option>
            <option value="album">Album</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Release Date</label>
          <TMDatePicker
            value={formData.releaseDate}
            onChange={(date) => setFormData({ ...formData, releaseDate: date })}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Cover Art URL</label>
          <input
            type="url"
            value={formData.coverArtUrl || ''}
            onChange={(e) => setFormData({ ...formData, coverArtUrl: e.target.value })}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Budget</label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              value={formData.budget}
              onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
              className="pl-7 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              required
              min="0"
              step="100"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Distribution Platforms</label>
        <div className="mt-2 space-y-2">
          {['Spotify', 'Apple Music', 'Amazon Music', 'YouTube Music', 'Deezer', 'Tidal', 'Vinyl', 'CD'].map((platform) => (
            <label key={platform} className="inline-flex items-center mr-4">
              <input
                type="checkbox"
                checked={formData.distributionPlatforms.includes(platform)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setFormData({
                      ...formData,
                      distributionPlatforms: [...formData.distributionPlatforms, platform]
                    });
                  } else {
                    setFormData({
                      ...formData,
                      distributionPlatforms: formData.distributionPlatforms.filter(p => p !== platform)
                    });
                  }
                }}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="ml-2 text-sm text-gray-700">{platform}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Pre-Release Activities</label>
          <div className="mt-1 flex gap-2">
            <input
              type="text"
              value={newPreReleaseActivity}
              onChange={(e) => setNewPreReleaseActivity(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              placeholder="Add a pre-release activity"
            />
            <button
              type="button"
              onClick={() => handleActivityAdd('preRelease', newPreReleaseActivity)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
            >
              Add
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {formData.marketingActivities.preRelease.map((activity, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                <span className="text-sm text-gray-700">{activity}</span>
                <button
                  type="button"
                  onClick={() => handleActivityRemove('preRelease', index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Release Day Activities</label>
          <div className="mt-1 flex gap-2">
            <input
              type="text"
              value={newReleaseDayActivity}
              onChange={(e) => setNewReleaseDayActivity(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              placeholder="Add a release day activity"
            />
            <button
              type="button"
              onClick={() => handleActivityAdd('releaseDay', newReleaseDayActivity)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
            >
              Add
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {formData.marketingActivities.releaseDay.map((activity, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                <span className="text-sm text-gray-700">{activity}</span>
                <button
                  type="button"
                  onClick={() => handleActivityRemove('releaseDay', index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Post-Release Activities</label>
          <div className="mt-1 flex gap-2">
            <input
              type="text"
              value={newPostReleaseActivity}
              onChange={(e) => setNewPostReleaseActivity(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              placeholder="Add a post-release activity"
            />
            <button
              type="button"
              onClick={() => handleActivityAdd('postRelease', newPostReleaseActivity)}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
            >
              Add
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {formData.marketingActivities.postRelease.map((activity, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                <span className="text-sm text-gray-700">{activity}</span>
                <button
                  type="button"
                  onClick={() => handleActivityRemove('postRelease', index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Target Audience</label>
          <div className="mt-1 flex gap-2">
            <input
              type="text"
              value={newTargetAudience}
              onChange={(e) => setNewTargetAudience(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              placeholder="Add target audience"
            />
            <button
              type="button"
              onClick={handleTargetAudienceAdd}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
            >
              Add
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {formData.targetAudience.map((audience, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                <span className="text-sm text-gray-700">{audience}</span>
                <button
                  type="button"
                  onClick={() => handleTargetAudienceRemove(index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Goals</label>
          <div className="mt-1 flex gap-2">
            <input
              type="text"
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
              placeholder="Add a goal"
            />
            <button
              type="button"
              onClick={handleGoalAdd}
              className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
            >
              Add
            </button>
          </div>
          <div className="mt-2 space-y-2">
            {formData.goals.map((goal, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                <span className="text-sm text-gray-700">{goal}</span>
                <button
                  type="button"
                  onClick={() => handleGoalRemove(index)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
            placeholder="Add any additional notes or comments..."
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
        >
          {initialData ? 'Update' : 'Create'} Release Plan
        </button>
      </div>
    </form>
  );
}