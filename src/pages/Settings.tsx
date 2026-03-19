import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Bell, Globe, Shield, LogOut, Mail, Phone, Lock, Key, Users, LockKeyhole, UserPlus, Trash2 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { hasPermission, getPermissionsForRole, Permission, Role, getModuleAccess, getAccessLevelLabel, getAvailableAccessLevels, AccessLevel, ModulePermissions } from '../lib/permissions';
import PlatformIntegrations from '../components/settings/PlatformIntegrations';
import AnalyticsIntegrations from '../components/settings/AnalyticsIntegrations';
import InviteUserModal from '../components/settings/InviteUserModal';
import { getTeamMembers, getUserPermissions, updateUserPermission, updateUserRole, TeamMember, UserPermission } from '../lib/userManagement';

const SETTINGS_CATEGORIES = [
  { id: 'profile', name: 'Profile', icon: User },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'integrations', name: 'Show Sync', icon: Globe },
  { id: 'analytics', name: 'Analytics', icon: Bell },
  { id: 'security', name: 'Security', icon: Shield },
  { id: 'permissions', name: 'Permissions', icon: LockKeyhole },
];

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuthStore();
  const [activeCategory, setActiveCategory] = useState('profile');
  const [isConnected, setIsConnected] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    email: user?.email || '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    email: false,
    browser: false,
  });

  // Permissions state
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<keyof ModulePermissions | null>(null);
  const [selectedAccess, setSelectedAccess] = useState<AccessLevel | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Check if user is admin or artist manager
  useEffect(() => {
    if (user) {
      setIsAdmin(user.role === 'admin' || user.role === 'artist_manager');
    }
  }, [user]);

  // Load team members
  const loadTeamMembers = async () => {
    setIsLoadingMembers(true);
    try {
      const members = await getTeamMembers();
      setTeamMembers(members);
    } catch (error) {
      console.error('Error loading team members:', error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadTeamMembers();
    }
  }, [isAdmin]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNotificationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = e.target;
    setNotifications(prev => ({
      ...prev,
      [id.split('_')[0]]: checked
    }));
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const handleSaveProfile = () => {
    // Here you would typically make an API call to update the user's profile
    console.log('Saving profile:', formData);
  };

  const handleSaveNotifications = () => {
    // Here you would typically make an API call to update notification preferences
    console.log('Saving notification preferences:', notifications);
  };

  const handleSavePassword = () => {
    // Here you would typically make an API call to update the password
    console.log('Saving new password');
  };

  const handleUpdatePermissions = async () => {
    if (!selectedMember || !selectedModule || !selectedAccess) return;

    try {
      await updateUserPermission(selectedMember, selectedModule, selectedAccess);

      // Reset form
      setSelectedMember(null);
      setSelectedModule(null);
      setSelectedAccess(null);

      // Reload team members to show updated data
      loadTeamMembers();
    } catch (error) {
      console.error('Error updating permissions:', error);
    }
  };

  const handleRoleChange = async (userId: string, newRole: Role) => {
    try {
      await updateUserRole(userId, newRole);
      loadTeamMembers();
    } catch (error) {
      console.error('Error updating role:', error);
    }
  };

  const renderContent = () => {
    switch (activeCategory) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Profile Settings</h2>
              <p className="mt-1 text-sm text-gray-500">
                Update your personal information and preferences
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="pl-10 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <input
                  type="text"
                  value={user?.role || ''}
                  className="mt-1 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-gray-50"
                  readOnly
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveProfile}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
              >
                Save Changes
              </button>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Notification Preferences</h2>
              <p className="mt-1 text-sm text-gray-500">
                Choose how you want to be notified
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="email_notifications"
                    type="checkbox"
                    checked={notifications.email}
                    onChange={handleNotificationChange}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="email_notifications" className="text-sm font-medium text-gray-700">
                    Email Notifications
                  </label>
                  <p className="text-sm text-gray-500">
                    Receive updates about your account via email
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="browser_notifications"
                    type="checkbox"
                    checked={notifications.browser}
                    onChange={handleNotificationChange}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                </div>
                <div className="ml-3">
                  <label htmlFor="browser_notifications" className="text-sm font-medium text-gray-700">
                    Browser Notifications
                  </label>
                  <p className="text-sm text-gray-500">
                    Get notified in your browser when important events occur
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveNotifications}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
              >
                Save Preferences
              </button>
            </div>
          </div>
        );

      case 'integrations':
        return <PlatformIntegrations />;

      case 'analytics':
        return <AnalyticsIntegrations />;

      case 'security':
        return (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-medium text-gray-900">Security Settings</h2>
              <p className="mt-1 text-sm text-gray-500">
                Manage your account security and authentication
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    className="pl-10 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="pl-10 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Key className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10 block w-full rounded-none border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSavePassword}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
              >
                Update Password
              </button>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </div>
        );

      case 'permissions':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">Access Management</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Manage access permissions for team members
                </p>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
                >
                  <UserPlus className="w-4 h-4" />
                  Invite User
                </button>
              )}
            </div>

            {isAdmin ? (
              <div className="space-y-6">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <Users className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-blue-700">
                        As an administrator, you can manage access permissions for all team members.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Team Member
                    </label>
                    <select
                      value={selectedMember || ''}
                      onChange={(e) => setSelectedMember(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                    >
                      <option value="">Select a team member</option>
                      {teamMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.full_name || member.email} ({member.role.replace('_', ' ')})
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedMember && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Module
                        </label>
                        <select
                          value={selectedModule || ''}
                          onChange={(e) => setSelectedModule(e.target.value)}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                        >
                          <option value="">Select a module</option>
                          <option value="catalog">Catalog</option>
                          <option value="finance">Finance</option>
                          <option value="legal">Legal</option>
                          <option value="live">Live</option>
                          <option value="marketing">Marketing</option>
                          <option value="personnel">Personnel</option>
                          <option value="info">Sensitive Info</option>
                          <option value="dashboard">Dashboard</option>
                        </select>
                      </div>

                      {selectedModule && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Access Level
                          </label>
                          <select
                            value={selectedAccess || ''}
                            onChange={(e) => setSelectedAccess(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                          >
                            <option value="">Select access level</option>
                            <option value="view">View Only</option>
                            <option value="comment">Can Comment</option>
                            <option value="edit">Can Edit</option>
                            <option value="full">Full Access</option>
                          </select>
                        </div>
                      )}

                      {selectedMember && selectedModule && selectedAccess && (
                        <div className="flex justify-end">
                          <button
                            onClick={handleUpdatePermissions}
                            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
                          >
                            Update Access Level
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>

                {/* Team Members Table */}
                <div className="mt-8">
                  <h3 className="text-md font-medium text-gray-900 mb-4">Team Members</h3>

                  {isLoadingMembers ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-sm text-gray-500">Loading team members...</div>
                    </div>
                  ) : teamMembers.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                      <Users className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No team members</h3>
                      <p className="mt-1 text-sm text-gray-500">Get started by inviting your first team member.</p>
                      <div className="mt-6">
                        <button
                          onClick={() => setIsInviteModalOpen(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
                        >
                          <UserPlus className="w-4 h-4" />
                          Invite User
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white shadow overflow-hidden border border-gray-200 sm:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Team Member
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Role
                            </th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Joined
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {teamMembers.map((member) => (
                            <tr key={member.id}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center">
                                  <div className="h-10 w-10 flex-shrink-0">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                      <span className="text-sm font-medium text-primary">
                                        {(member.full_name || member.email).charAt(0).toUpperCase()}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="ml-4">
                                    <div className="text-sm font-medium text-gray-900">
                                      {member.full_name || 'Unnamed User'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {member.email}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  {member.role.replace('_', ' ')}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(member.created_at).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-6 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <LockKeyhole className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-gray-900">Your Access Permissions</h3>
                    <div className="mt-4 space-y-4">
                      {['catalog', 'finance', 'legal', 'live', 'marketing', 'personnel', 'info', 'dashboard'].map(module => {
                        const accessLevel = getModuleAccess(user, module as any);
                        return (
                          <div key={module} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">{module.charAt(0).toUpperCase() + module.slice(1)}</span>
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              accessLevel ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {accessLevel ? getAccessLevelLabel(accessLevel) : 'No Access'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                    <p className="mt-4 text-sm text-gray-500">
                      Contact your administrator if you need additional access.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 font-title">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your account settings and preferences
        </p>
      </div>

      <InviteUserModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onSuccess={() => loadTeamMembers()}
      />

      <div className="flex gap-8">
        {/* Categories Sidebar */}
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-1 flex flex-col h-full">
            {SETTINGS_CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md ${
                    activeCategory === category.id
                      ? 'bg-primary/10 text-primary'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {category.name}
                </button>
              );
            })}
            <div className="pt-4 mt-4 border-t border-gray-200">
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium rounded-md text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 bg-white shadow-md rounded-lg p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}