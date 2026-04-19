export const INDUSTRY_ROLES = [
  'manager','day_to_day_manager','tour_manager','business_manager','booking_agent',
  'publicist','marketing_manager','a_and_r','sync_agent','label_rep','publisher_rep',
  'lawyer','accountant',
  'producer','songwriter','composer','engineer','mixing_engineer','mastering_engineer',
  'session_musician','vocalist',
  'front_of_house','monitor_engineer','lighting_designer','backline_tech','stage_manager',
  'driver','promoter','talent_buyer','production_manager',
  'photographer','videographer','stylist','journalist','dj',
  'other',
] as const;
export type IndustryRole = typeof INDUSTRY_ROLES[number];

export const ROLE_LABELS: Record<IndustryRole, string> = {
  manager: 'Manager', day_to_day_manager: 'Day-to-Day Manager', tour_manager: 'Tour Manager',
  business_manager: 'Business Manager', booking_agent: 'Booking Agent',
  publicist: 'Publicist', marketing_manager: 'Marketing Manager', a_and_r: 'A&R',
  sync_agent: 'Sync Agent', label_rep: 'Label Rep', publisher_rep: 'Publisher Rep',
  lawyer: 'Lawyer', accountant: 'Accountant', producer: 'Producer',
  songwriter: 'Songwriter', composer: 'Composer', engineer: 'Engineer',
  mixing_engineer: 'Mixing Engineer', mastering_engineer: 'Mastering Engineer',
  session_musician: 'Session Musician', vocalist: 'Vocalist',
  front_of_house: 'FOH Engineer', monitor_engineer: 'Monitor Engineer',
  lighting_designer: 'Lighting Designer', backline_tech: 'Backline Tech',
  stage_manager: 'Stage Manager', driver: 'Driver', promoter: 'Promoter',
  talent_buyer: 'Talent Buyer', production_manager: 'Production Manager',
  photographer: 'Photographer', videographer: 'Videographer',
  stylist: 'Stylist', journalist: 'Journalist', dj: 'DJ', other: 'Other',
};

export function displayRole(role: string, custom?: string | null): string {
  if (role === 'other' && custom) return custom;
  return ROLE_LABELS[role as IndustryRole] ?? role;
}
