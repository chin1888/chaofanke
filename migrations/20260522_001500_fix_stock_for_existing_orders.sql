-- ============================================
-- Fix stock for already placed orders
-- Run this in Supabase SQL Editor
-- Deducts sold quantities from product stock
-- ============================================

-- Calculate total sold qty per product from confirmed/completed/pending orders
WITH sold_per_product AS (
  SELECT
    oi.product_id,
    SUM(oi.quantity) AS total_sold
  FROM order_items oi
  JOIN orders o ON o.id = oi.order_id
  WHERE o.status IN ('confirmed', 'completed', 'pending', 'processing')
  GROUP BY oi.product_id
)
-- Update product stock (don't go below 0)
UPDATE products p
SET stock = GREATEST(p.stock - COALESCE(s.total_sold, 0), 0)
FROM sold_per_product s
WHERE p.id = s.product_id;

-- Optional: show results
-- SELECT name, stock FROM products ORDER BY name;
