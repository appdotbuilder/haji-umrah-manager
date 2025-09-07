import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { inventoryItemsTable, suppliersTable } from '../db/schema';
import { type CreateInventoryItemInput } from '../schema';
import {
  createInventoryItem,
  getInventoryItems,
  getInventoryItemById,
  getLowStockItems,
  getInventorySummary
} from '../handlers/inventory';
import { eq } from 'drizzle-orm';

// Test supplier data
const testSupplier = {
  name: 'Test Supplier',
  contact_person: 'John Doe',
  email: 'supplier@test.com',
  phone: '+1234567890',
  address: '123 Supplier St',
  supplier_type: 'Equipment'
};

// Test inventory item inputs
const testItemInput: CreateInventoryItemInput = {
  item_name: 'Test Item',
  item_code: 'TI001',
  category: 'Electronics',
  description: 'A test electronic item',
  unit_cost: 25.50,
  selling_price: 35.99,
  current_stock: 100,
  minimum_stock: 10,
  supplier_id: null
};

const lowStockItemInput: CreateInventoryItemInput = {
  item_name: 'Low Stock Item',
  item_code: 'LSI001',
  category: 'Accessories',
  description: 'Item with low stock',
  unit_cost: 15.00,
  selling_price: 20.00,
  current_stock: 5,
  minimum_stock: 10,
  supplier_id: null
};

describe('Inventory Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createInventoryItem', () => {
    it('should create an inventory item without supplier', async () => {
      const result = await createInventoryItem(testItemInput);

      expect(result.item_name).toEqual('Test Item');
      expect(result.item_code).toEqual('TI001');
      expect(result.category).toEqual('Electronics');
      expect(result.description).toEqual('A test electronic item');
      expect(result.unit_cost).toEqual(25.50);
      expect(result.selling_price).toEqual(35.99);
      expect(result.current_stock).toEqual(100);
      expect(result.minimum_stock).toEqual(10);
      expect(result.supplier_id).toBeNull();
      expect(result.is_active).toBe(true);
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should create an inventory item with supplier', async () => {
      // Create a supplier first
      const supplierResult = await db.insert(suppliersTable)
        .values(testSupplier)
        .returning()
        .execute();
      const supplierId = supplierResult[0].id;

      const inputWithSupplier = {
        ...testItemInput,
        supplier_id: supplierId
      };

      const result = await createInventoryItem(inputWithSupplier);

      expect(result.supplier_id).toEqual(supplierId);
      expect(result.item_name).toEqual('Test Item');
      expect(result.unit_cost).toEqual(25.50);
      expect(typeof result.unit_cost).toBe('number');
    });

    it('should save inventory item to database', async () => {
      const result = await createInventoryItem(testItemInput);

      const items = await db.select()
        .from(inventoryItemsTable)
        .where(eq(inventoryItemsTable.id, result.id))
        .execute();

      expect(items).toHaveLength(1);
      expect(items[0].item_name).toEqual('Test Item');
      expect(parseFloat(items[0].unit_cost)).toEqual(25.50);
      expect(parseFloat(items[0].selling_price)).toEqual(35.99);
    });

    it('should throw error for non-existent supplier', async () => {
      const inputWithInvalidSupplier = {
        ...testItemInput,
        supplier_id: 999
      };

      await expect(createInventoryItem(inputWithInvalidSupplier))
        .rejects.toThrow(/Supplier with ID 999 not found/);
    });
  });

  describe('getInventoryItems', () => {
    it('should return empty array when no items exist', async () => {
      const result = await getInventoryItems();
      expect(result).toEqual([]);
    });

    it('should return all active inventory items', async () => {
      // Create multiple items
      await createInventoryItem(testItemInput);
      await createInventoryItem({
        ...testItemInput,
        item_name: 'Second Item',
        item_code: 'TI002'
      });

      const result = await getInventoryItems();

      expect(result).toHaveLength(2);
      expect(result[0].item_name).toEqual('Test Item');
      expect(result[1].item_name).toEqual('Second Item');
      expect(typeof result[0].unit_cost).toBe('number');
      expect(typeof result[0].selling_price).toBe('number');
    });

    it('should only return active items', async () => {
      // Create an item
      const item = await createInventoryItem(testItemInput);

      // Deactivate the item directly in database
      await db.update(inventoryItemsTable)
        .set({ is_active: false })
        .where(eq(inventoryItemsTable.id, item.id))
        .execute();

      const result = await getInventoryItems();
      expect(result).toHaveLength(0);
    });
  });

  describe('getInventoryItemById', () => {
    it('should return null for non-existent item', async () => {
      const result = await getInventoryItemById(999);
      expect(result).toBeNull();
    });

    it('should return inventory item by ID', async () => {
      const created = await createInventoryItem(testItemInput);
      const result = await getInventoryItemById(created.id);

      expect(result).not.toBeNull();
      expect(result!.id).toEqual(created.id);
      expect(result!.item_name).toEqual('Test Item');
      expect(result!.unit_cost).toEqual(25.50);
      expect(typeof result!.unit_cost).toBe('number');
    });

    it('should return inactive items by ID', async () => {
      const created = await createInventoryItem(testItemInput);

      // Deactivate the item
      await db.update(inventoryItemsTable)
        .set({ is_active: false })
        .where(eq(inventoryItemsTable.id, created.id))
        .execute();

      const result = await getInventoryItemById(created.id);
      expect(result).not.toBeNull();
      expect(result!.is_active).toBe(false);
    });
  });

  describe('getLowStockItems', () => {
    it('should return empty array when no low stock items', async () => {
      await createInventoryItem(testItemInput);
      const result = await getLowStockItems();
      expect(result).toEqual([]);
    });

    it('should return items with stock at or below minimum', async () => {
      // Create normal stock item
      await createInventoryItem(testItemInput);

      // Create low stock item (current_stock <= minimum_stock)
      await createInventoryItem(lowStockItemInput);

      // Create critical stock item (current_stock < minimum_stock)
      await createInventoryItem({
        ...lowStockItemInput,
        item_name: 'Critical Stock Item',
        item_code: 'CSI001',
        current_stock: 3,
        minimum_stock: 10
      });

      const result = await getLowStockItems();

      expect(result).toHaveLength(2);
      expect(result.some(item => item.item_name === 'Low Stock Item')).toBe(true);
      expect(result.some(item => item.item_name === 'Critical Stock Item')).toBe(true);
      expect(typeof result[0].unit_cost).toBe('number');
    });

    it('should only return active low stock items', async () => {
      // Create low stock item
      const lowStockItem = await createInventoryItem(lowStockItemInput);

      // Deactivate the item
      await db.update(inventoryItemsTable)
        .set({ is_active: false })
        .where(eq(inventoryItemsTable.id, lowStockItem.id))
        .execute();

      const result = await getLowStockItems();
      expect(result).toHaveLength(0);
    });
  });

  describe('getInventorySummary', () => {
    it('should return zero summary when no items exist', async () => {
      const result = await getInventorySummary();

      expect(result.totalItems).toEqual(0);
      expect(result.totalValue).toEqual(0);
      expect(result.lowStockItems).toEqual(0);
      expect(result.categories).toEqual([]);
    });

    it('should calculate correct inventory summary', async () => {
      // Create test items with different categories
      await createInventoryItem(testItemInput); // Electronics, stock: 100, cost: 25.50
      await createInventoryItem({
        ...testItemInput,
        item_name: 'Item 2',
        item_code: 'TI002',
        category: 'Books',
        current_stock: 50,
        unit_cost: 10.00
      }); // Books, stock: 50, cost: 10.00
      await createInventoryItem(lowStockItemInput); // Accessories, stock: 5, cost: 15.00 (low stock)

      const result = await getInventorySummary();

      expect(result.totalItems).toEqual(3);
      // Total value = (100 * 25.50) + (50 * 10.00) + (5 * 15.00) = 2550 + 500 + 75 = 3125
      expect(result.totalValue).toEqual(3125);
      expect(result.lowStockItems).toEqual(1);
      expect(result.categories).toHaveLength(3);
      expect(result.categories.sort()).toEqual(['Accessories', 'Books', 'Electronics']);
    });

    it('should only count active items in summary', async () => {
      // Create items
      const item1 = await createInventoryItem(testItemInput);
      await createInventoryItem(lowStockItemInput);

      // Deactivate one item
      await db.update(inventoryItemsTable)
        .set({ is_active: false })
        .where(eq(inventoryItemsTable.id, item1.id))
        .execute();

      const result = await getInventorySummary();

      expect(result.totalItems).toEqual(1);
      expect(result.lowStockItems).toEqual(1);
      expect(result.categories).toEqual(['Accessories']);
    });

    it('should handle items with zero stock correctly', async () => {
      await createInventoryItem({
        ...testItemInput,
        current_stock: 0,
        unit_cost: 100.00
      });

      const result = await getInventorySummary();

      expect(result.totalItems).toEqual(1);
      expect(result.totalValue).toEqual(0); // 0 * 100 = 0
      expect(result.lowStockItems).toEqual(1); // 0 <= 10
    });
  });
});