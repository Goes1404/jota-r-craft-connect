-- Create function to update stock when sale is created
CREATE OR REPLACE FUNCTION update_product_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
  -- Update product stock when a sale is created
  IF TG_OP = 'INSERT' THEN
    UPDATE products 
    SET stock = stock - NEW.quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
  END IF;
  
  -- Restore product stock when a sale is deleted
  IF TG_OP = 'DELETE' THEN
    UPDATE products 
    SET stock = stock + OLD.quantity
    WHERE id = OLD.product_id;
    RETURN OLD;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for stock updates
CREATE TRIGGER trigger_update_product_stock_on_sale
  AFTER INSERT OR DELETE ON sales
  FOR EACH ROW
  EXECUTE FUNCTION update_product_stock_on_sale();