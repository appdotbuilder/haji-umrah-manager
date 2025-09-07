import { db } from '../db';
import { inventoryItemsTable, suppliersTable } from '../db/schema';
import { type InventoryItem, type CreateInventoryItemInput } from '../schema';
import { eq, lt, sql, isNull } from 'drizzle-orm';

export const createInventoryItem = async (input: CreateInventoryItemInput): Promise<InventoryItem> => {
  try {
    // Verify supplier exists if supplier_id is provided
    if (input.supplier_id) {
      const supplier = await db.select()
        .from(suppliersTable)
        .where(eq(suppliersTable.id, input.supplier_id))
        .execute();
      
      if (supplier.length === 0) {
        throw new Error(`Supplier with ID ${input.supplier_id} not found`);
      }
    }

    // Insert inventory item record
    const result = await db.insert(inventoryItemsTable)
      .values({
        item_name: input.item_name,
        item_code: input.item_code,
        category: input.category,
        description: input.description,
        unit_cost: input.unit_cost.toString(),
        selling_price: input.selling_price.toString(),
        current_stock: input.current_stock,
        minimum_stock: input.minimum_stock,
        supplier_id: input.supplier_id
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const item = result[0];
    return {
      ...item,
      unit_cost: parseFloat(item.unit_cost),
      selling_price: parseFloat(item.selling_price)
    };
  } catch (error) {
    console.error('Inventory item creation failed:', error);
    throw error;
  }
};

export const getInventoryItems = async (): Promise<InventoryItem[]> => {
  try {
    const items = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.is_active, true))
      .execute();

    // Convert numeric fields back to numbers
    return items.map(item => ({
      ...item,
      unit_cost: parseFloat(item.unit_cost),
      selling_price: parseFloat(item.selling_price)
    }));
  } catch (error) {
    console.error('Failed to fetch inventory items:', error);
    throw error;
  }
};

export const getInventoryItemById = async (id: number): Promise<InventoryItem | null> => {
  try {
    const items = await db.select()
      .from(inventoryItemsTable)
      .where(eq(inventoryItemsTable.id, id))
      .execute();

    if (items.length === 0) {
      return null;
    }

    const item = items[0];
    return {
      ...item,
      unit_cost: parseFloat(item.unit_cost),
      selling_price: parseFloat(item.selling_price)
    };
  } catch (error) {
    console.error('Failed to fetch inventory item by ID:', error);
    throw error;
  }
};

export const getLowStockItems = async (): Promise<InventoryItem[]> => {
  try {
    const items = await db.select()
      .from(inventoryItemsTable)
      .where(
        sql`${inventoryItemsTable.current_stock} <= ${inventoryItemsTable.minimum_stock} AND ${inventoryItemsTable.is_active} = true`
      )
      .execute();

    // Convert numeric fields back to numbers
    return items.map(item => ({
      ...item,
      unit_cost: parseFloat(item.unit_cost),
      selling_price: parseFloat(item.selling_price)
    }));
  } catch (error) {
    console.error('Failed to fetch low stock items:', error);
    throw error;
  }
};

export const getInventorySummary = async (): Promise<{
  totalItems: number;
  totalValue: number;
  lowStockItems: number;
  categories: string[];
}> => {
  try {
    // Get total items count
    const totalItemsResult = await db.select({
      count: sql<number>`count(*)`
    })
    .from(inventoryItemsTable)
    .where(eq(inventoryItemsTable.is_active, true))
    .execute();

    const totalItems = Number(totalItemsResult[0]?.count || 0);

    // Get total inventory value (current_stock * unit_cost)
    const totalValueResult = await db.select({
      totalValue: sql<string>`sum(${inventoryItemsTable.current_stock} * ${inventoryItemsTable.unit_cost})`
    })
    .from(inventoryItemsTable)
    .where(eq(inventoryItemsTable.is_active, true))
    .execute();

    const totalValue = parseFloat(totalValueResult[0]?.totalValue || '0');

    // Get low stock items count
    const lowStockResult = await db.select({
      count: sql<number>`count(*)`
    })
    .from(inventoryItemsTable)
    .where(
      sql`${inventoryItemsTable.current_stock} <= ${inventoryItemsTable.minimum_stock} AND ${inventoryItemsTable.is_active} = true`
    )
    .execute();

    const lowStockItems = Number(lowStockResult[0]?.count || 0);

    // Get unique categories
    const categoriesResult = await db.select({
      category: inventoryItemsTable.category
    })
    .from(inventoryItemsTable)
    .where(eq(inventoryItemsTable.is_active, true))
    .groupBy(inventoryItemsTable.category)
    .execute();

    const categories = categoriesResult.map(row => row.category);

    return {
      totalItems,
      totalValue,
      lowStockItems,
      categories
    };
  } catch (error) {
    console.error('Failed to fetch inventory summary:', error);
    throw error;
  }
};