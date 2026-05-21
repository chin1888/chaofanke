-- ============================================
-- Auto-sync product_likes/product_shares counts to products table
-- Run this in Supabase SQL Editor
-- ============================================

-- 1. Function: update likes_count
CREATE OR REPLACE FUNCTION update_product_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products SET likes_count = likes_count + 1 WHERE id = NEW.product_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.product_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Trigger on product_likes
DROP TRIGGER IF EXISTS trg_product_likes_count ON product_likes;
CREATE TRIGGER trg_product_likes_count
AFTER INSERT OR DELETE ON product_likes
FOR EACH ROW
EXECUTE FUNCTION update_product_likes_count();

-- 3. Function: update shares_count
CREATE OR REPLACE FUNCTION update_product_shares_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products SET shares_count = shares_count + 1 WHERE id = NEW.product_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger on product_shares
DROP TRIGGER IF EXISTS trg_product_shares_count ON product_shares;
CREATE TRIGGER trg_product_shares_count
AFTER INSERT ON product_shares
FOR EACH ROW
EXECUTE FUNCTION update_product_shares_count();

-- 5. One-time sync: set current counts from existing data
UPDATE products SET likes_count = (
  SELECT COUNT(*) FROM product_likes WHERE product_likes.product_id = products.id
);

UPDATE products SET shares_count = (
  SELECT COUNT(*) FROM product_shares WHERE product_shares.product_id = products.id
);
