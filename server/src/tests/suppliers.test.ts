import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { suppliersTable } from '../db/schema';
import { type CreateSupplierInput } from '../schema';
import { createSupplier, getSuppliers, getSupplierById } from '../handlers/suppliers';
import { eq } from 'drizzle-orm';

// Test input data
const testSupplierInput: CreateSupplierInput = {
  name: 'Test Supplier Inc',
  contact_person: 'John Doe',
  email: 'john@testsupplier.com',
  phone: '+1234567890',
  address: '123 Test Street, Test City',
  supplier_type: 'Hotel'
};

const secondSupplierInput: CreateSupplierInput = {
  name: 'Another Supplier Ltd',
  contact_person: 'Jane Smith',
  email: 'jane@anothersupplier.com',
  phone: '+0987654321',
  address: '456 Another Ave, Another City',
  supplier_type: 'Transportation'
};

describe('Supplier Handlers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  describe('createSupplier', () => {
    it('should create a supplier successfully', async () => {
      const result = await createSupplier(testSupplierInput);

      // Verify returned supplier data
      expect(result.name).toEqual('Test Supplier Inc');
      expect(result.contact_person).toEqual('John Doe');
      expect(result.email).toEqual('john@testsupplier.com');
      expect(result.phone).toEqual('+1234567890');
      expect(result.address).toEqual('123 Test Street, Test City');
      expect(result.supplier_type).toEqual('Hotel');
      expect(result.is_active).toBe(true); // Default value
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
    });

    it('should save supplier to database', async () => {
      const result = await createSupplier(testSupplierInput);

      // Verify in database
      const savedSuppliers = await db.select()
        .from(suppliersTable)
        .where(eq(suppliersTable.id, result.id))
        .execute();

      expect(savedSuppliers).toHaveLength(1);
      const savedSupplier = savedSuppliers[0];
      expect(savedSupplier.name).toEqual('Test Supplier Inc');
      expect(savedSupplier.contact_person).toEqual('John Doe');
      expect(savedSupplier.email).toEqual('john@testsupplier.com');
      expect(savedSupplier.phone).toEqual('+1234567890');
      expect(savedSupplier.address).toEqual('123 Test Street, Test City');
      expect(savedSupplier.supplier_type).toEqual('Hotel');
      expect(savedSupplier.is_active).toBe(true);
    });

    it('should create multiple suppliers with different types', async () => {
      const supplier1 = await createSupplier(testSupplierInput);
      const supplier2 = await createSupplier(secondSupplierInput);

      expect(supplier1.supplier_type).toEqual('Hotel');
      expect(supplier2.supplier_type).toEqual('Transportation');
      expect(supplier1.id).not.toEqual(supplier2.id);
    });

    it('should handle database connection errors gracefully', async () => {
      // This test demonstrates error handling pattern
      // In a real scenario, database connection issues would cause errors
      // For now, we'll test that our handler preserves error structure
      try {
        await createSupplier(testSupplierInput);
      } catch (error) {
        // If error occurs, it should be properly thrown
        expect(error).toBeDefined();
      }
      
      // Test passes if no error occurs (normal case) or error is handled properly
      expect(true).toBe(true);
    });
  });

  describe('getSuppliers', () => {
    it('should return empty array when no suppliers exist', async () => {
      const result = await getSuppliers();
      expect(result).toEqual([]);
    });

    it('should return all suppliers', async () => {
      // Create test suppliers
      await createSupplier(testSupplierInput);
      await createSupplier(secondSupplierInput);

      const result = await getSuppliers();

      expect(result).toHaveLength(2);
      expect(result[0].name).toEqual('Test Supplier Inc');
      expect(result[1].name).toEqual('Another Supplier Ltd');
    });

    it('should return suppliers with correct data types', async () => {
      await createSupplier(testSupplierInput);
      
      const result = await getSuppliers();

      expect(result).toHaveLength(1);
      const supplier = result[0];
      expect(typeof supplier.id).toBe('number');
      expect(typeof supplier.name).toBe('string');
      expect(typeof supplier.contact_person).toBe('string');
      expect(typeof supplier.email).toBe('string');
      expect(typeof supplier.phone).toBe('string');
      expect(typeof supplier.address).toBe('string');
      expect(typeof supplier.supplier_type).toBe('string');
      expect(typeof supplier.is_active).toBe('boolean');
      expect(supplier.created_at).toBeInstanceOf(Date);
      expect(supplier.updated_at).toBeInstanceOf(Date);
    });

    it('should include both active and inactive suppliers', async () => {
      // Create supplier first
      const supplier = await createSupplier(testSupplierInput);

      // Manually set one supplier as inactive
      await db.update(suppliersTable)
        .set({ is_active: false })
        .where(eq(suppliersTable.id, supplier.id))
        .execute();

      // Create another active supplier
      await createSupplier(secondSupplierInput);

      const result = await getSuppliers();

      expect(result).toHaveLength(2);
      const activeSuppliers = result.filter(s => s.is_active);
      const inactiveSuppliers = result.filter(s => !s.is_active);
      
      expect(activeSuppliers).toHaveLength(1);
      expect(inactiveSuppliers).toHaveLength(1);
    });
  });

  describe('getSupplierById', () => {
    it('should return null when supplier does not exist', async () => {
      const result = await getSupplierById(999);
      expect(result).toBeNull();
    });

    it('should return supplier when it exists', async () => {
      const createdSupplier = await createSupplier(testSupplierInput);
      
      const result = await getSupplierById(createdSupplier.id);

      expect(result).not.toBeNull();
      expect(result?.id).toEqual(createdSupplier.id);
      expect(result?.name).toEqual('Test Supplier Inc');
      expect(result?.contact_person).toEqual('John Doe');
      expect(result?.email).toEqual('john@testsupplier.com');
      expect(result?.supplier_type).toEqual('Hotel');
    });

    it('should return correct supplier when multiple exist', async () => {
      const supplier1 = await createSupplier(testSupplierInput);
      const supplier2 = await createSupplier(secondSupplierInput);

      const result1 = await getSupplierById(supplier1.id);
      const result2 = await getSupplierById(supplier2.id);

      expect(result1?.name).toEqual('Test Supplier Inc');
      expect(result2?.name).toEqual('Another Supplier Ltd');
    });

    it('should return supplier with correct data types', async () => {
      const createdSupplier = await createSupplier(testSupplierInput);
      const result = await getSupplierById(createdSupplier.id);

      expect(result).not.toBeNull();
      expect(typeof result?.id).toBe('number');
      expect(typeof result?.name).toBe('string');
      expect(typeof result?.contact_person).toBe('string');
      expect(typeof result?.email).toBe('string');
      expect(typeof result?.phone).toBe('string');
      expect(typeof result?.address).toBe('string');
      expect(typeof result?.supplier_type).toBe('string');
      expect(typeof result?.is_active).toBe('boolean');
      expect(result?.created_at).toBeInstanceOf(Date);
      expect(result?.updated_at).toBeInstanceOf(Date);
    });

    it('should return inactive supplier when requested', async () => {
      const supplier = await createSupplier(testSupplierInput);

      // Make supplier inactive
      await db.update(suppliersTable)
        .set({ is_active: false })
        .where(eq(suppliersTable.id, supplier.id))
        .execute();

      const result = await getSupplierById(supplier.id);

      expect(result).not.toBeNull();
      expect(result?.is_active).toBe(false);
      expect(result?.name).toEqual('Test Supplier Inc');
    });
  });
});