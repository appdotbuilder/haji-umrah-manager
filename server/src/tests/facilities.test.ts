import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { facilitiesTable } from '../db/schema';
import { type CreateFacilityInput } from '../schema';
import { createFacility, getFacilities, getFacilityById } from '../handlers/facilities';
import { eq } from 'drizzle-orm';

// Test input data
const testFacilityInput: CreateFacilityInput = {
  facility_name: 'Grand Makkah Hotel',
  facility_type: 'Accommodation',
  location: 'Makkah, Saudi Arabia',
  capacity: 200,
  cost_per_person: 150.75,
  description: 'Luxury hotel near Haram'
};

const testFacilityInput2: CreateFacilityInput = {
  facility_name: 'Madinah Transport',
  facility_type: 'Transportation',
  location: 'Madinah, Saudi Arabia',
  capacity: 50,
  cost_per_person: 85.50,
  description: 'Bus transportation service'
};

const testFacilityInputMinimal: CreateFacilityInput = {
  facility_name: 'Basic Facility',
  facility_type: 'Food',
  location: 'Jeddah, Saudi Arabia',
  capacity: 100,
  cost_per_person: 25.00,
  description: null
};

describe('createFacility', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a facility with all fields', async () => {
    const result = await createFacility(testFacilityInput);

    // Verify all fields are correctly set
    expect(result.facility_name).toEqual('Grand Makkah Hotel');
    expect(result.facility_type).toEqual('Accommodation');
    expect(result.location).toEqual('Makkah, Saudi Arabia');
    expect(result.capacity).toEqual(200);
    expect(result.cost_per_person).toEqual(150.75);
    expect(typeof result.cost_per_person).toBe('number');
    expect(result.description).toEqual('Luxury hotel near Haram');
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create a facility with null description', async () => {
    const result = await createFacility(testFacilityInputMinimal);

    expect(result.facility_name).toEqual('Basic Facility');
    expect(result.description).toBeNull();
    expect(result.cost_per_person).toEqual(25.00);
    expect(typeof result.cost_per_person).toBe('number');
  });

  it('should save facility to database correctly', async () => {
    const result = await createFacility(testFacilityInput);

    // Query the database directly to verify storage
    const facilities = await db.select()
      .from(facilitiesTable)
      .where(eq(facilitiesTable.id, result.id))
      .execute();

    expect(facilities).toHaveLength(1);
    expect(facilities[0].facility_name).toEqual('Grand Makkah Hotel');
    expect(facilities[0].facility_type).toEqual('Accommodation');
    expect(facilities[0].location).toEqual('Makkah, Saudi Arabia');
    expect(facilities[0].capacity).toEqual(200);
    expect(parseFloat(facilities[0].cost_per_person)).toEqual(150.75);
    expect(facilities[0].description).toEqual('Luxury hotel near Haram');
    expect(facilities[0].is_active).toBe(true);
    expect(facilities[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle decimal precision correctly', async () => {
    const precisionInput: CreateFacilityInput = {
      facility_name: 'Precision Test Hotel',
      facility_type: 'Accommodation',
      location: 'Test City',
      capacity: 10,
      cost_per_person: 99.99,
      description: 'Testing decimal precision'
    };

    const result = await createFacility(precisionInput);
    
    expect(result.cost_per_person).toEqual(99.99);
    expect(typeof result.cost_per_person).toBe('number');
  });
});

describe('getFacilities', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no facilities exist', async () => {
    const result = await getFacilities();
    
    expect(result).toEqual([]);
  });

  it('should return all facilities', async () => {
    // Create test facilities
    await createFacility(testFacilityInput);
    await createFacility(testFacilityInput2);

    const result = await getFacilities();

    expect(result).toHaveLength(2);
    
    // Check first facility
    const facility1 = result.find(f => f.facility_name === 'Grand Makkah Hotel');
    expect(facility1).toBeDefined();
    expect(facility1!.facility_type).toEqual('Accommodation');
    expect(facility1!.cost_per_person).toEqual(150.75);
    expect(typeof facility1!.cost_per_person).toBe('number');
    
    // Check second facility
    const facility2 = result.find(f => f.facility_name === 'Madinah Transport');
    expect(facility2).toBeDefined();
    expect(facility2!.facility_type).toEqual('Transportation');
    expect(facility2!.cost_per_person).toEqual(85.50);
    expect(typeof facility2!.cost_per_person).toBe('number');
  });

  it('should return facilities with proper data types', async () => {
    await createFacility(testFacilityInput);

    const result = await getFacilities();

    expect(result).toHaveLength(1);
    const facility = result[0];
    
    expect(typeof facility.id).toBe('number');
    expect(typeof facility.facility_name).toBe('string');
    expect(typeof facility.capacity).toBe('number');
    expect(typeof facility.cost_per_person).toBe('number');
    expect(typeof facility.is_active).toBe('boolean');
    expect(facility.created_at).toBeInstanceOf(Date);
    expect(facility.updated_at).toBeInstanceOf(Date);
  });

  it('should include both active and inactive facilities', async () => {
    // Create facility and then manually deactivate it
    const facility = await createFacility(testFacilityInput);
    
    // Manually update to inactive
    await db.update(facilitiesTable)
      .set({ is_active: false })
      .where(eq(facilitiesTable.id, facility.id))
      .execute();

    const result = await getFacilities();
    
    expect(result).toHaveLength(1);
    expect(result[0].is_active).toBe(false);
  });
});

describe('getFacilityById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null for non-existent facility', async () => {
    const result = await getFacilityById(999);
    
    expect(result).toBeNull();
  });

  it('should return facility by ID', async () => {
    const createdFacility = await createFacility(testFacilityInput);

    const result = await getFacilityById(createdFacility.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(createdFacility.id);
    expect(result!.facility_name).toEqual('Grand Makkah Hotel');
    expect(result!.facility_type).toEqual('Accommodation');
    expect(result!.location).toEqual('Makkah, Saudi Arabia');
    expect(result!.capacity).toEqual(200);
    expect(result!.cost_per_person).toEqual(150.75);
    expect(typeof result!.cost_per_person).toBe('number');
    expect(result!.description).toEqual('Luxury hotel near Haram');
  });

  it('should return correct facility when multiple exist', async () => {
    const facility1 = await createFacility(testFacilityInput);
    const facility2 = await createFacility(testFacilityInput2);

    const result = await getFacilityById(facility2.id);

    expect(result).not.toBeNull();
    expect(result!.id).toEqual(facility2.id);
    expect(result!.facility_name).toEqual('Madinah Transport');
    expect(result!.facility_type).toEqual('Transportation');
    expect(result!.cost_per_person).toEqual(85.50);
  });

  it('should handle facility with null description', async () => {
    const facility = await createFacility(testFacilityInputMinimal);

    const result = await getFacilityById(facility.id);

    expect(result).not.toBeNull();
    expect(result!.facility_name).toEqual('Basic Facility');
    expect(result!.description).toBeNull();
  });

  it('should return facility with proper data types', async () => {
    const facility = await createFacility(testFacilityInput);

    const result = await getFacilityById(facility.id);

    expect(result).not.toBeNull();
    expect(typeof result!.id).toBe('number');
    expect(typeof result!.facility_name).toBe('string');
    expect(typeof result!.capacity).toBe('number');
    expect(typeof result!.cost_per_person).toBe('number');
    expect(typeof result!.is_active).toBe('boolean');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });
});