INSERT INTO groups (name, code)
VALUES ('Capareda Boarding House', 'CAREDA')
ON CONFLICT DO NOTHING;

DO $$
DECLARE
  default_group_id UUID;
BEGIN
  SELECT id INTO default_group_id FROM groups WHERE code = 'CAREDA';
  
  UPDATE users 
  SET group_id = default_group_id 
  WHERE group_id IS NULL;
  
  UPDATE transactions 
  SET group_id = default_group_id 
  WHERE group_id IS NULL;
  
  RAISE NOTICE 'Migration complete! All users and transactions assigned to default group.';
END $$;

SELECT 
  (SELECT COUNT(*) FROM users WHERE group_id IS NOT NULL) as users_with_group,
  (SELECT COUNT(*) FROM users WHERE group_id IS NULL) as users_without_group,
  (SELECT COUNT(*) FROM transactions WHERE group_id IS NOT NULL) as transactions_with_group,
  (SELECT COUNT(*) FROM transactions WHERE group_id IS NULL) as transactions_without_group;
