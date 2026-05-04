BEGIN;

-- Load pgTAP
CREATE EXTENSION IF NOT EXISTS pgtap;

-- We are going to run 26 tests
SELECT plan(26);

-- 1. Test if columns were added to the `orders` table
SELECT has_column('public', 'orders', 'user_id', 'Table orders should have user_id column');
SELECT has_column('public', 'orders', 'tracking_code', 'Table orders should have tracking_code column');
SELECT has_column('public', 'orders', 'shipping_address', 'Table orders should have shipping_address column');
SELECT has_column('public', 'orders', 'payment_method', 'Table orders should have payment_method column');
SELECT has_column('public', 'orders', 'customer_email', 'Table orders should have customer_email column');
SELECT has_column('public', 'orders', 'customer_name', 'Table orders should have customer_name column');
SELECT has_column('public', 'orders', 'customer_cpf', 'Table orders should have customer_cpf column');
SELECT has_column('public', 'orders', 'customer_phone', 'Table orders should have customer_phone column');
SELECT has_column('public', 'orders', 'pix_qr_code', 'Table orders should have pix_qr_code column');
SELECT has_column('public', 'orders', 'pix_qr_code_text', 'Table orders should have pix_qr_code_text column');
SELECT has_column('public', 'orders', 'payment_intent_id', 'Table orders should have payment_intent_id column');

-- 2. Test if column was added to the `products` table
SELECT has_column('public', 'products', 'cost', 'Table products should have cost column');

-- 3. Test if `abandoned_carts` table exists and has necessary columns
SELECT has_table('public', 'abandoned_carts', 'Table abandoned_carts should exist');
SELECT has_column('public', 'abandoned_carts', 'id', 'Table abandoned_carts should have id column');
SELECT has_column('public', 'abandoned_carts', 'user_id', 'Table abandoned_carts should have user_id column');
SELECT has_column('public', 'abandoned_carts', 'email', 'Table abandoned_carts should have email column');
SELECT has_column('public', 'abandoned_carts', 'cart_items', 'Table abandoned_carts should have cart_items column');
SELECT has_column('public', 'abandoned_carts', 'total_amount', 'Table abandoned_carts should have total_amount column');
SELECT has_column('public', 'abandoned_carts', 'status', 'Table abandoned_carts should have status column');

-- 4. Test if RLS is enabled on `abandoned_carts`
SELECT results_eq(
    $$ SELECT relrowsecurity FROM pg_class WHERE oid = 'public.abandoned_carts'::regclass $$,
    ARRAY[true],
    'Row Level Security should be enabled on abandoned_carts table'
);

-- 5. Test if policies exist for `abandoned_carts`
SELECT policies_are(
    'public',
    'abandoned_carts',
    ARRAY[
        'Anyone can create abandoned carts',
        'Authenticated users can manage abandoned carts'
    ],
    'Policies for abandoned_carts should be correctly defined'
);

-- 6. Test if `profiles` table exists and has new columns
SELECT has_table('public', 'profiles', 'Table profiles should exist');
SELECT has_column('public', 'profiles', 'id', 'Table profiles should have id column');
SELECT has_column('public', 'profiles', 'full_name', 'Table profiles should have full_name column');
SELECT has_column('public', 'profiles', 'vip_level', 'Table profiles should have vip_level column');
SELECT has_column('public', 'profiles', 'total_spent', 'Table profiles should have total_spent column');

-- Finish the tests and clean up
SELECT * FROM finish();

ROLLBACK;
