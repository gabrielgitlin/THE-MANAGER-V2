import React, { useState } from 'react';
import { X, Mail, UserPlus, Loader2 } from 'lucide-react';
import { Role } from '../../lib/permissions';
import { inviteUser } from '../../lib/userManagement';
import Modal from '../Modal';

interface InviteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
  {
    value: 'artist_manager',
    label: 'Artist Manager',
    description: 'Full access to all features and settings',
  },
  {
    value: 'tour_manager',
    label: 'Tour Manager',
    description: 'Manage live shows, venues, and tour logistics',
  },
  {
    value: 'marketing_manager',
    label: 'Marketing Manager',
    description: 'Manage marketing campaigns and analytics',
  },
  {
    value: 'finance_manager',
    label: 'Finance Manager',
    description: 'Manage budgets, finances, and payments',
  },
  {
    value: 'attorney',
    label: 'Attorney',
    description: 'Access to legal documents and contracts',
  },
  {
    value: 'team_member',
    label: 'Team Member',
    description: 'Basic view access to catalog and shows',
  },
];

export default function InviteUserModal({ isOpen, onClose, onSuccess }: InviteUserModalProps) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('team_member');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const tempPassword = Math.random().toString(36).slice(-12) + 'Aa1!';
      setGeneratedPassword(tempPassword);

      await inviteUser(email, role);
      setSuccess(true);
      onSuccess();
    } catch (err: any) {
      console.error('Invite error:', err);
      if (err.message?.includes('already registered')) {
        setError('This email is already registered. User may already have an account.');
      } else {
        setError(err.message || 'Failed to invite user. Please check your Supabase email settings.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setEmail('');
      setRole('team_member');
      setError(null);
      setSuccess(false);
      setGeneratedPassword(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="">
      <div className="p-6">
        {success ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">User Invited Successfully!</h3>
                <p className="text-sm text-gray-500">The account has been created</p>
              </div>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-blue-800">Next Steps</h4>
                  <div className="mt-2 text-sm text-blue-700">
                    <p className="mb-2">The user <strong>{email}</strong> has been added to your team with the role of <strong>{role.replace('_', ' ')}</strong>.</p>
                    <p className="mb-2">They can now:</p>
                    <ol className="list-decimal ml-4 space-y-1">
                      <li>Go to the login page</li>
                      <li>Click "Forgot Password"</li>
                      <li>Enter their email to receive a password reset link</li>
                      <li>Set their own password and access the platform</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-yellow-800">Email Configuration</h4>
                  <p className="mt-1 text-sm text-yellow-700">
                    If you want users to receive automatic invitation emails, configure your Supabase email settings in the Authentication section of your Supabase dashboard.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Invite Team Member</h3>
                <p className="text-sm text-gray-500">Send an invitation to join your team</p>
              </div>
            </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                placeholder="colleague@example.com"
                required
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Role & Permissions
            </label>
            <div className="space-y-2">
              {ROLE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    role === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={role === option.value}
                    onChange={(e) => setRole(e.target.value as Role)}
                    className="mt-1 text-primary focus:ring-primary"
                    disabled={isLoading}
                  />
                  <div className="ml-3">
                    <div className="text-sm font-medium text-gray-900">{option.label}</div>
                    <div className="text-sm text-gray-500">{option.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Invitation'
              )}
            </button>
          </div>
        </form>
          </>
        )}
      </div>
    </Modal>
  );
}
