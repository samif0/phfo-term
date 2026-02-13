# Monthly Restore Drill Checklist

## Preconditions
- Latest export exists in `backups/YYYY-MM-DD/content-items.json`.
- Supabase project credentials available for a non-production environment.

## Steps
1. Create a temporary restore table or temporary project.
2. Import exported JSON rows into `content_items`.
3. Verify row counts and random spot-check 5 records across each content type.
4. Open app against restored dataset and verify reads for `/writings`, `/thoughts`, `/programs`.
5. Test one create/edit/delete cycle in temporary environment.
6. Record drill date, result, and gaps in an ops log.

## Success Criteria
- Data import succeeds with no schema mismatch.
- Core read/write flows function against restored data.
- Any failures have explicit follow-up actions.
