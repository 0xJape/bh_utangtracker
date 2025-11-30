INSERT INTO groups (name, code)
VALUES ('Capareda Boarding House', 'CAREDA');

SELECT * FROM groups WHERE code = 'CAREDA';

UPDATE users 
SET group_id = (SELECT id FROM groups WHERE code = 'CAREDA')
WHERE group_id IS NULL;

UPDATE transactions 
SET group_id = (SELECT id FROM groups WHERE code = 'CAREDA')
WHERE group_id IS NULL;

SELECT 
  'Users with group' as type,
  COUNT(*) as count
FROM users 
WHERE group_id IS NOT NULL

UNION ALL

SELECT 
  'Users without group' as type,
  COUNT(*) as count
FROM users 
WHERE group_id IS NULL

UNION ALL

SELECT 
  'Transactions with group' as type,
  COUNT(*) as count
FROM transactions 
WHERE group_id IS NOT NULL

UNION ALL

SELECT 
  'Transactions without group' as type,
  COUNT(*) as count
FROM transactions 
WHERE group_id IS NULL;
