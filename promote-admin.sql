-- Promote test admin user to admin role
UPDATE users
SET role = 'admin', email_verified = true, updated_at = CURRENT_TIMESTAMP
WHERE email = 'admin@test.com';

-- Verify the update
SELECT id, email, name, role, email_verified FROM users WHERE email = 'admin@test.com';