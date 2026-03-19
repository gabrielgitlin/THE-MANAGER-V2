import React, { useState } from 'react';
import { Lock, Check, X, Users, ChevronDown, ChevronUp } from 'lucide-react';
import type { Permission, Role, AccessLevel, ModulePermissions } from '../lib/permissions';
import { hasPermission, getAccessLevelLabel, getAvailableAccessLevels, getModuleAccess, updateModuleAccess } from '../lib/permissions';
import { useAuthStore } from '../store/authStore';

interface PermissionsPopupProps {
  requiredPermission: Permission | null;
  isVisible: boolean;
  position?: 'left' | 'right' | 'top' | 'bottom';
}

// Mock team members - in a real app, this would come from your database
const mockTeamMembers = [
  { id: '1', name: 'Sarah Johnson', role: 'marketing_manager' as Role },
  { id: '2', name: 'Mike Williams', role: 'tour_manager' as Role },
  { id: '3', name: 'Emma Thompson', role: 'team_member' as Role },
];

export default function PermissionsPopup({ requiredPermission, isVisible, position = 'right' }: PermissionsPopupProps) {
  const { user } = useAuthStore();
  const [showManagePermissions, setShowManagePermissions] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [selectedAccess, setSelectedAccess] = useState<AccessLevel | null>(null);

  if (!isVisible || !requiredPermission) return null;

  const hasAccess = hasPermission(user, requiredPermission);
  const canManagePermissions = user?.role === 'artist_manager' || user?.role === 'admin';

  // Get the module from the permission
  const module = requiredPermission.split('_')[1] as keyof ModulePermissions;
  const availableAccessLevels = getAvailableAccessLevels(module);
  
  // Get the user's current access level for this module
  const currentAccessLevel = getModuleAccess(user, module);

  const handleUpdatePermissions = async () => {
    if (!selectedMember || !selectedAccess || !module) return;
    
    try {
      await updateModuleAccess(selectedMember, module, selectedAccess);
      
      // Reset form
      setSelectedMember(null);
      setSelectedAccess(null);
    } catch (error) {
      console.error('Error updating permissions:', error);
    }
  };

  const positionClasses = {
    left: 'right-full mr-2 top-1/2 -translate-y-1/2',
    right: 'left-full ml-2 top-1/2 -translate-y-1/2',
    top: 'bottom-full mb-2 left-1/2 -translate-x-1/2',
    bottom: 'top-full mt-2 left-1/2 -translate-x-1/2'
  };

  return (
    <div className={`absolute z-50 ${positionClasses[position]}`}>
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 w-80">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-medium text-charcoal">
            Permissions
          </h3>
        </div>

        <div className="space-y-3">
          <div>
            <div className="text-xs font-medium text-gray-500">Status</div>
            <div className={`mt-1 flex items-center gap-1 text-sm ${
              hasAccess ? 'text-green-600' : 'text-red-600'
            }`}>
              {hasAccess ? (
                <>
                  <Check className="w-4 h-4" />
                  Access Granted
                </>
              ) : (
                <>
                  <X className="w-4 h-4" />
                  Access Denied
                </>
              )}
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-gray-500">Your Access</div>
            <div className="mt-1 text-sm text-charcoal">
              {currentAccessLevel ? getAccessLevelLabel(currentAccessLevel) : 'No Access'}
            </div>
          </div>

          {canManagePermissions && (
            <div className="pt-3 border-t">
              <button
                onClick={() => setShowManagePermissions(!showManagePermissions)}
                className="flex items-center gap-2 text-sm text-primary hover:text-black"
              >
                <Users className="w-4 h-4" />
                Manage Team Access
                {showManagePermissions ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showManagePermissions && (
                <div className="mt-3 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-500">
                      Team Member
                    </label>
                    <select
                      value={selectedMember || ''}
                      onChange={(e) => setSelectedMember(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    >
                      <option value="">Select a team member</option>
                      {mockTeamMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedMember && (
                    <div>
                      <label className="block text-xs font-medium text-gray-500">
                        Access Level
                      </label>
                      <select
                        value={selectedAccess || ''}
                        onChange={(e) => setSelectedAccess(e.target.value as AccessLevel)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                      >
                        <option value="">Select access level</option>
                        {availableAccessLevels.map((level) => (
                          <option key={level} value={level}>
                            {getAccessLevelLabel(level)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedMember && selectedAccess && (
                    <div className="pt-2">
                      <button
                        onClick={handleUpdatePermissions}
                        className="w-full px-3 py-2 text-sm text-white bg-primary rounded-md hover:bg-primary"
                      >
                        Update Access Level
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}