-- Archive legacy personnel/publisher/PRO tables by renaming with _deprecated_ prefix.
-- All 6 tables were confirmed to exist before this migration.
-- These tables are superseded by the unified contacts + project_relations architecture.
ALTER TABLE personnel RENAME TO _deprecated_personnel;
ALTER TABLE personnel_profiles RENAME TO _deprecated_personnel_profiles;
ALTER TABLE personnel_pros RENAME TO _deprecated_personnel_pros;
ALTER TABLE personnel_publishers RENAME TO _deprecated_personnel_publishers;
ALTER TABLE publishers RENAME TO _deprecated_publishers;
ALTER TABLE performance_rights_organizations RENAME TO _deprecated_performance_rights_organizations;
