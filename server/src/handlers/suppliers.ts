import { db } from '../db';
import { suppliersTable } from '../db/schema';
import { type Supplier, type CreateSupplierInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function createSupplier(input: CreateSupplierInput): Promise<Supplier> {
  try {
    // Insert supplier record
    const result = await db.insert(suppliersTable)
      .values({
        name: input.name,
        contact_person: input.contact_person,
        email: input.email,
        phone: input.phone,
        address: input.address,
        supplier_type: input.supplier_type
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Supplier creation failed:', error);
    throw error;
  }
}

export async function getSuppliers(): Promise<Supplier[]> {
  try {
    const suppliers = await db.select()
      .from(suppliersTable)
      .execute();

    return suppliers;
  } catch (error) {
    console.error('Failed to fetch suppliers:', error);
    throw error;
  }
}

export async function getSupplierById(id: number): Promise<Supplier | null> {
  try {
    const suppliers = await db.select()
      .from(suppliersTable)
      .where(eq(suppliersTable.id, id))
      .execute();

    return suppliers[0] || null;
  } catch (error) {
    console.error('Failed to fetch supplier by ID:', error);
    throw error;
  }
}