import { User } from '../types';

export type AccessLevel = 'view' | 'comment' | 'edit' | 'full';

export type Permission = 
  | 'view_catalog'
  | 'edit_catalog'
  | 'view_finance'
  | 'edit_finance'
  | 'view_legal'
  | 'edit_legal'
  | 'view_live'
  | 'edit_live'
  | 'view_marketing'
  | 'edit_marketing'
  | 'view_personnel'
  | 'edit_personnel'
  | 'view_sensitive_info'
  | 'edit_sensitive_info'
  | 'view_dashboard'
  | 'edit_dashboard';

export type Role = 
  | 'admin'
  | 'artist_manager'
  | 'artist'
  | 'attorney'
  | 'tour_manager'
  | 'marketing_manager'
  | 'finance_manager'
  | 'team_member';

export type ModulePermissions = {
  catalog?: AccessLevel;
  finance?: AccessLevel;
  legal?: AccessLevel;
  live?: AccessLevel;
  marketing?: AccessLevel;
  personnel?: AccessLevel;
  info?: AccessLevel;
  dashboard?: AccessLevel;
};

// Define default permissions for each role
const rolePermissions: Record<Role, ModulePermissions> = {
  admin: {
    catalog: 'full',
    finance: 'full',
    legal: 'full',
    live: 'full',
    marketing: 'full',
    personnel: 'full',
    info: 'full',
    dashboard: 'full'
  },
  artist_manager: {
    catalog: 'full',
    finance: 'full',
    legal: 'full',
    live: 'full',
    marketing: 'full',
    personnel: 'full',
    info: 'full',
    dashboard: 'full'
  },
  artist: {
    catalog: 'view',
    finance: 'view',
    legal: 'view',
    live: 'view',
    marketing: 'view',
    dashboard: 'view'
  },
  attorney: {
    catalog: 'view',
    legal: 'edit',
    info: 'view',
    dashboard: 'view'
  },
  tour_manager: {
    catalog: 'view',
    live: 'edit',
    personnel: 'edit',
    dashboard: 'view'
  },
  marketing_manager: {
    catalog: 'view',
    marketing: 'edit',
    dashboard: 'view'
  },
  finance_manager: {
    catalog: 'view',
    finance: 'edit',
    info: 'view',
    dashboard: 'view'
  },
  team_member: {
    catalog: 'view',
    live: 'view',
    dashboard: 'view'
  }
};

// Map permission to module and required access level
const permissionRequirements: Record<Permission, { module: keyof ModulePermissions, level: AccessLevel }> = {
  view_catalog: { module: 'catalog', level: 'view' },
  edit_catalog: { module: 'catalog', level: 'edit' },
  view_finance: { module: 'finance', level: 'view' },
  edit_finance: { module: 'finance', level: 'edit' },
  view_legal: { module: 'legal', level: 'view' },
  edit_legal: { module: 'legal', level: 'edit' },
  view_live: { module: 'live', level: 'view' },
  edit_live: { module: 'live', level: 'edit' },
  view_marketing: { module: 'marketing', level: 'view' },
  edit_marketing: { module: 'marketing', level: 'edit' },
  view_personnel: { module: 'personnel', level: 'view' },
  edit_personnel: { module: 'personnel', level: 'edit' },
  view_sensitive_info: { module: 'info', level: 'view' },
  edit_sensitive_info: { module: 'info', level: 'edit' },
  view_dashboard: { module: 'dashboard', level: 'view' },
  edit_dashboard: { module: 'dashboard', level: 'edit' }
};

// Access level hierarchy
const accessLevelHierarchy: Record<AccessLevel, number> = {
  'view': 1,
  'comment': 2,
  'edit': 3,
  'full': 4
};

// Check if a user has a specific permission
export const hasPermission = (user: User | null, permission: Permission): boolean => {
  if (!user) return false;
  
  const userRole = user.role as Role;
  const requirement = permissionRequirements[permission];
  const userAccess = rolePermissions[userRole]?.[requirement.module];
  
  if (!userAccess) return false;
  
  return accessLevelHierarchy[userAccess] >= accessLevelHierarchy[requirement.level];
};

// Get access level for a specific module
export const getModuleAccess = (user: User | null, module: keyof ModulePermissions): AccessLevel | null => {
  if (!user) return null;
  const userRole = user.role as Role;
  return rolePermissions[userRole]?.[module] || null;
};

// Get all permissions for a role
export const getPermissionsForRole = (role: Role): Permission[] => {
  const permissions: Permission[] = [];
  const roleAccess = rolePermissions[role];

  Object.entries(permissionRequirements).forEach(([permission, requirement]) => {
    const moduleAccess = roleAccess[requirement.module];
    if (moduleAccess && accessLevelHierarchy[moduleAccess] >= accessLevelHierarchy[requirement.level]) {
      permissions.push(permission as Permission);
    }
  });

  return permissions;
};

// Check if a user has any of the specified permissions
export const hasAnyPermission = (user: User | null, permissions: Permission[]): boolean => {
  if (!user) return false;
  return permissions.some(permission => hasPermission(user, permission));
};

// Check if a user has all of the specified permissions
export const hasAllPermissions = (user: User | null, permissions: Permission[]): boolean => {
  if (!user) return false;
  return permissions.every(permission => hasPermission(user, permission));
};

// Update a user's module access level
export const updateModuleAccess = async (
  userId: string,
  module: keyof ModulePermissions,
  level: AccessLevel
): Promise<void> => {
  // In a real app, this would make an API call to update the user's permissions
  console.log('Updating module access:', { userId, module, level });
};

// Get the label for an access level
export const getAccessLevelLabel = (level: AccessLevel): string => {
  switch (level) {
    case 'view':
      return 'View Only';
    case 'comment':
      return 'Can Comment';
    case 'edit':
      return 'Can Edit';
    case 'full':
      return 'Full Access';
  }
};

// Get available access levels for a module
export const getAvailableAccessLevels = (module: keyof ModulePermissions): AccessLevel[] => {
  // You can customize this based on module-specific requirements
  return ['view', 'comment', 'edit', 'full'];
};