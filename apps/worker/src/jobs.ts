// Queue names and schedules. Syncs (Spotify, Bandsintown, Songkick, YouTube) and emails move here
// from the Supabase edge functions, one module at a time.
export const QUEUES = {
  heartbeat: 'system.heartbeat',
} as const;

export const SCHEDULES: { queue: string; cron: string }[] = [
  { queue: QUEUES.heartbeat, cron: '*/5 * * * *' },
];
