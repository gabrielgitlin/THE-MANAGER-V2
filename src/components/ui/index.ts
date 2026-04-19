/* ══════════════════════════════════════════════
   The Manager — Design System Components
   ══════════════════════════════════════════════ */

export { default as Button } from './Button';
export type { ButtonProps } from './Button';

export { TMCard, TMCardHeader, TMCardBody, TMCardFooter } from './TMCard';
export { TMTabs, TMTabPanel } from './TMTabs';
export { default as DataTable } from './DataTable';
export type { Column } from './DataTable';
export { default as EmptyState } from './EmptyState';
export { default as FormField } from './FormField';
export { default as Badge } from './Badge';
export { default as Dropdown } from './Dropdown';

/* Re-export existing shadcn-style components */
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './card';
export { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';
