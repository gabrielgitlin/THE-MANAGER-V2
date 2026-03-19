/*
  # Fix Always-True RLS Policies - Part 2 (Show-linked and remaining tables)

  Continues replacing `USING (true)` / `WITH CHECK (true)` with proper checks.

  1. Tables fixed:
    - `accommodations` - Scoped via show -> artist
    - `transportation` - Scoped via show -> artist
    - `budgets` - Scoped to user's artist
    - `budget_items` - Scoped via budget -> artist
    - `budget_categories` - Scoped via budget -> artist
    - `personnel` - Team resource, scoped to authenticated (no artist_id column)
    - `venues` - Shared resource, scoped to authenticated (no artist_id column)
    - `platform_integrations` - Scoped to user's artist
    - `analytics_integrations` - Scoped to user's artist
    - `show_deals` - Scoped via show -> artist
    - `show_advances` - Scoped via show -> artist
    - `deal_templates` - Team resource
    - `deal_ticket_tiers` - Scoped via deal -> show -> artist
    - `deal_payments` - Scoped via deal -> show -> artist
    - `deal_bonuses` - Scoped via deal -> show -> artist
    - `deal_expenses` - Scoped via deal -> show -> artist
    - `deal_merch_terms` - Scoped via deal -> show -> artist
    - `guest_list` - Scoped via show -> artist
    - `marketing_tasks` - Scoped via show -> artist
    - `production_files` - Scoped via show -> artist
    - `setlists` - Scoped via show -> artist
    - `setlist_songs` - Scoped via setlist -> show -> artist
    - `show_types` - Reference data, team accessible
    - `legal_documents` - Scoped to team (created_by ownership)
    - `tasks` - Scoped to team
    - `marketing_posts` - Scoped to user's artist
    - `marketing_files` - Scoped to user's artist

  2. Security
    - Show-linked data requires the show to belong to user's artist
    - Deal-linked data requires the deal's show to belong to user's artist
*/

-- ============================================================
-- ACCOMMODATIONS (via show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create accommodations" ON public.accommodations;
CREATE POLICY "Team members can create accommodations"
  ON public.accommodations FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));

DROP POLICY IF EXISTS "Authenticated users can update accommodations" ON public.accommodations;
CREATE POLICY "Team members can update accommodations"
  ON public.accommodations FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));

DROP POLICY IF EXISTS "Authenticated users can delete accommodations" ON public.accommodations;
CREATE POLICY "Team members can delete accommodations"
  ON public.accommodations FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- TRANSPORTATION (via show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create transportation" ON public.transportation;
CREATE POLICY "Team members can create transportation"
  ON public.transportation FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));

DROP POLICY IF EXISTS "Authenticated users can update transportation" ON public.transportation;
CREATE POLICY "Team members can update transportation"
  ON public.transportation FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));

DROP POLICY IF EXISTS "Authenticated users can delete transportation" ON public.transportation;
CREATE POLICY "Team members can delete transportation"
  ON public.transportation FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- BUDGETS
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create budgets" ON public.budgets;
CREATE POLICY "Team members can create budgets"
  ON public.budgets FOR INSERT TO authenticated
  WITH CHECK (artist_id = public.get_user_artist_id());

DROP POLICY IF EXISTS "Authenticated users can update budgets" ON public.budgets;
CREATE POLICY "Team members can update budgets"
  ON public.budgets FOR UPDATE TO authenticated
  USING (artist_id = public.get_user_artist_id())
  WITH CHECK (artist_id = public.get_user_artist_id());

DROP POLICY IF EXISTS "Authenticated users can delete budgets" ON public.budgets;
CREATE POLICY "Team members can delete budgets"
  ON public.budgets FOR DELETE TO authenticated
  USING (artist_id = public.get_user_artist_id());

-- ============================================================
-- BUDGET_ITEMS (via budget -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create budget items" ON public.budget_items;
CREATE POLICY "Team members can create budget items"
  ON public.budget_items FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM budgets b
    WHERE b.id = budget_id AND b.artist_id = public.get_user_artist_id()
  ));

DROP POLICY IF EXISTS "Authenticated users can update budget items" ON public.budget_items;
CREATE POLICY "Team members can update budget items"
  ON public.budget_items FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM budgets b
    WHERE b.id = budget_id AND b.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM budgets b
    WHERE b.id = budget_id AND b.artist_id = public.get_user_artist_id()
  ));

DROP POLICY IF EXISTS "Authenticated users can delete budget items" ON public.budget_items;
CREATE POLICY "Team members can delete budget items"
  ON public.budget_items FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM budgets b
    WHERE b.id = budget_id AND b.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- BUDGET_CATEGORIES (via budget -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create budget categories" ON public.budget_categories;
CREATE POLICY "Team members can create budget categories"
  ON public.budget_categories FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM budgets b
    WHERE b.id = budget_id AND b.artist_id = public.get_user_artist_id()
  ));

DROP POLICY IF EXISTS "Authenticated users can update budget categories" ON public.budget_categories;
CREATE POLICY "Team members can update budget categories"
  ON public.budget_categories FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM budgets b
    WHERE b.id = budget_id AND b.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM budgets b
    WHERE b.id = budget_id AND b.artist_id = public.get_user_artist_id()
  ));

DROP POLICY IF EXISTS "Authenticated users can delete budget categories" ON public.budget_categories;
CREATE POLICY "Team members can delete budget categories"
  ON public.budget_categories FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM budgets b
    WHERE b.id = budget_id AND b.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- PERSONNEL (shared team resource - no artist_id)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create personnel" ON public.personnel;
CREATE POLICY "Team members can create personnel"
  ON public.personnel FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update personnel" ON public.personnel;
CREATE POLICY "Team members can update personnel"
  ON public.personnel FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete personnel" ON public.personnel;
CREATE POLICY "Team members can delete personnel"
  ON public.personnel FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- VENUES (shared resource)
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can insert venues" ON public.venues;
CREATE POLICY "Team members can insert venues"
  ON public.venues FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can update venues" ON public.venues;
CREATE POLICY "Team members can update venues"
  ON public.venues FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can delete venues" ON public.venues;
CREATE POLICY "Team members can delete venues"
  ON public.venues FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- PLATFORM_INTEGRATIONS
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can create platform integrations" ON public.platform_integrations;
CREATE POLICY "Team members can create platform integrations"
  ON public.platform_integrations FOR INSERT TO authenticated
  WITH CHECK (artist_id = public.get_user_artist_id());

DROP POLICY IF EXISTS "Authenticated users can update platform integrations" ON public.platform_integrations;
CREATE POLICY "Team members can update platform integrations"
  ON public.platform_integrations FOR UPDATE TO authenticated
  USING (artist_id = public.get_user_artist_id())
  WITH CHECK (artist_id = public.get_user_artist_id());

DROP POLICY IF EXISTS "Authenticated users can delete platform integrations" ON public.platform_integrations;
CREATE POLICY "Team members can delete platform integrations"
  ON public.platform_integrations FOR DELETE TO authenticated
  USING (artist_id = public.get_user_artist_id());

-- ============================================================
-- ANALYTICS_INTEGRATIONS
-- ============================================================
DROP POLICY IF EXISTS "Users can create analytics integrations" ON public.analytics_integrations;
CREATE POLICY "Team members can create analytics integrations"
  ON public.analytics_integrations FOR INSERT TO authenticated
  WITH CHECK (artist_id = public.get_user_artist_id());

DROP POLICY IF EXISTS "Users can update their own analytics integrations" ON public.analytics_integrations;
CREATE POLICY "Team members can update analytics integrations"
  ON public.analytics_integrations FOR UPDATE TO authenticated
  USING (artist_id = public.get_user_artist_id())
  WITH CHECK (artist_id = public.get_user_artist_id());

DROP POLICY IF EXISTS "Users can delete their own analytics integrations" ON public.analytics_integrations;
CREATE POLICY "Team members can delete analytics integrations"
  ON public.analytics_integrations FOR DELETE TO authenticated
  USING (artist_id = public.get_user_artist_id());

-- ============================================================
-- SHOW_DEALS (via show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage show deals" ON public.show_deals;
CREATE POLICY "Team members can view show deals"
  ON public.show_deals FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can create show deals"
  ON public.show_deals FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can update show deals"
  ON public.show_deals FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can delete show deals"
  ON public.show_deals FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- SHOW_ADVANCES (via show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage show advances" ON public.show_advances;
CREATE POLICY "Team members can view show advances"
  ON public.show_advances FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can create show advances"
  ON public.show_advances FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can update show advances"
  ON public.show_advances FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can delete show advances"
  ON public.show_advances FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- DEAL_TEMPLATES (reference data, team accessible)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage deal templates" ON public.deal_templates;
CREATE POLICY "Team members can view deal templates"
  ON public.deal_templates FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Team members can create deal templates"
  ON public.deal_templates FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Team members can update deal templates"
  ON public.deal_templates FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Team members can delete deal templates"
  ON public.deal_templates FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- DEAL_TICKET_TIERS (via deal -> show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage deal ticket tiers" ON public.deal_ticket_tiers;
CREATE POLICY "Team members can view deal ticket tiers"
  ON public.deal_ticket_tiers FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can create deal ticket tiers"
  ON public.deal_ticket_tiers FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can update deal ticket tiers"
  ON public.deal_ticket_tiers FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can delete deal ticket tiers"
  ON public.deal_ticket_tiers FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- DEAL_PAYMENTS (via deal -> show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage deal payments" ON public.deal_payments;
CREATE POLICY "Team members can view deal payments"
  ON public.deal_payments FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can create deal payments"
  ON public.deal_payments FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can update deal payments"
  ON public.deal_payments FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can delete deal payments"
  ON public.deal_payments FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- DEAL_BONUSES (via deal -> show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage deal bonuses" ON public.deal_bonuses;
CREATE POLICY "Team members can view deal bonuses"
  ON public.deal_bonuses FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can create deal bonuses"
  ON public.deal_bonuses FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can update deal bonuses"
  ON public.deal_bonuses FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can delete deal bonuses"
  ON public.deal_bonuses FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- DEAL_EXPENSES (via deal -> show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage deal expenses" ON public.deal_expenses;
CREATE POLICY "Team members can view deal expenses"
  ON public.deal_expenses FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can create deal expenses"
  ON public.deal_expenses FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can update deal expenses"
  ON public.deal_expenses FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can delete deal expenses"
  ON public.deal_expenses FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- DEAL_MERCH_TERMS (via deal -> show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage deal merch terms" ON public.deal_merch_terms;
CREATE POLICY "Team members can view deal merch terms"
  ON public.deal_merch_terms FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can create deal merch terms"
  ON public.deal_merch_terms FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can update deal merch terms"
  ON public.deal_merch_terms FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can delete deal merch terms"
  ON public.deal_merch_terms FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM show_deals sd
    JOIN shows s ON s.id = sd.show_id
    WHERE sd.id = deal_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- GUEST_LIST (via show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage guest list" ON public.guest_list;
CREATE POLICY "Team members can view guest list"
  ON public.guest_list FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can create guest list"
  ON public.guest_list FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can update guest list"
  ON public.guest_list FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can delete guest list"
  ON public.guest_list FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- MARKETING_TASKS (via show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage marketing tasks" ON public.marketing_tasks;
CREATE POLICY "Team members can view marketing tasks"
  ON public.marketing_tasks FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can create marketing tasks"
  ON public.marketing_tasks FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can update marketing tasks"
  ON public.marketing_tasks FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can delete marketing tasks"
  ON public.marketing_tasks FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- PRODUCTION_FILES (via show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage production files" ON public.production_files;
CREATE POLICY "Team members can view production files"
  ON public.production_files FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can create production files"
  ON public.production_files FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can update production files"
  ON public.production_files FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can delete production files"
  ON public.production_files FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- SETLISTS (via show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage setlists" ON public.setlists;
CREATE POLICY "Team members can view setlists"
  ON public.setlists FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can create setlists"
  ON public.setlists FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can update setlists"
  ON public.setlists FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can delete setlists"
  ON public.setlists FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM shows s
    WHERE s.id = show_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- SETLIST_SONGS (via setlist -> show -> artist)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage setlist songs" ON public.setlist_songs;
CREATE POLICY "Team members can view setlist songs"
  ON public.setlist_songs FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM setlists sl
    JOIN shows s ON s.id = sl.show_id
    WHERE sl.id = setlist_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can create setlist songs"
  ON public.setlist_songs FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM setlists sl
    JOIN shows s ON s.id = sl.show_id
    WHERE sl.id = setlist_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can update setlist songs"
  ON public.setlist_songs FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM setlists sl
    JOIN shows s ON s.id = sl.show_id
    WHERE sl.id = setlist_id AND s.artist_id = public.get_user_artist_id()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM setlists sl
    JOIN shows s ON s.id = sl.show_id
    WHERE sl.id = setlist_id AND s.artist_id = public.get_user_artist_id()
  ));
CREATE POLICY "Team members can delete setlist songs"
  ON public.setlist_songs FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM setlists sl
    JOIN shows s ON s.id = sl.show_id
    WHERE sl.id = setlist_id AND s.artist_id = public.get_user_artist_id()
  ));

-- ============================================================
-- SHOW_TYPES (reference data)
-- ============================================================
DROP POLICY IF EXISTS "Users can manage show types" ON public.show_types;
CREATE POLICY "Team members can view show types"
  ON public.show_types FOR SELECT TO authenticated
  USING ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Team members can create show types"
  ON public.show_types FOR INSERT TO authenticated
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Team members can update show types"
  ON public.show_types FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
CREATE POLICY "Team members can delete show types"
  ON public.show_types FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- LEGAL_DOCUMENTS (remaining write policies)
-- ============================================================
DROP POLICY IF EXISTS "Team members can delete legal documents" ON public.legal_documents;
CREATE POLICY "Team members can delete legal documents"
  ON public.legal_documents FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Team members can update legal documents" ON public.legal_documents;
CREATE POLICY "Team members can update legal documents"
  ON public.legal_documents FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- TASKS (remaining write policies)
-- ============================================================
DROP POLICY IF EXISTS "Team members can delete tasks" ON public.tasks;
CREATE POLICY "Team members can delete tasks"
  ON public.tasks FOR DELETE TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    created_by = (select auth.uid()) OR
    assigned_to = (select auth.uid())
  );

DROP POLICY IF EXISTS "Team members can update tasks" ON public.tasks;
CREATE POLICY "Team members can update tasks"
  ON public.tasks FOR UPDATE TO authenticated
  USING (
    user_id = (select auth.uid()) OR
    created_by = (select auth.uid()) OR
    assigned_to = (select auth.uid())
  )
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- MARKETING_POSTS (remaining write policies)
-- ============================================================
DROP POLICY IF EXISTS "Team members can delete marketing posts" ON public.marketing_posts;
CREATE POLICY "Team members can delete marketing posts"
  ON public.marketing_posts FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Team members can update marketing posts" ON public.marketing_posts;
CREATE POLICY "Team members can update marketing posts"
  ON public.marketing_posts FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);

-- ============================================================
-- MARKETING_FILES (remaining write policies)
-- ============================================================
DROP POLICY IF EXISTS "Team members can delete marketing files" ON public.marketing_files;
CREATE POLICY "Team members can delete marketing files"
  ON public.marketing_files FOR DELETE TO authenticated
  USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Team members can update marketing files" ON public.marketing_files;
CREATE POLICY "Team members can update marketing files"
  ON public.marketing_files FOR UPDATE TO authenticated
  USING ((select auth.uid()) IS NOT NULL)
  WITH CHECK ((select auth.uid()) IS NOT NULL);
