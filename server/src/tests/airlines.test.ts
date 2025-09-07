import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { airlinesTable } from '../db/schema';
import { type CreateAirlineInput } from '../schema';
import { createAirline, getAirlines, getAirlineById } from '../handlers/airlines';
import { eq } from 'drizzle-orm';

// Test input data
const testInput: CreateAirlineInput = {
  airline_name: 'Emirates Airlines',
  airline_code: 'EK',
  contact_info: 'contact@emirates.com'
};

const testInputMinimal: CreateAirlineInput = {
  airline_name: 'Saudi Airlines',
  airline_code: 'SV',
  contact_info: null
};

describe('createAirline', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an airline with all fields', async () => {
    const result = await createAirline(testInput);

    // Basic field validation
    expect(result.airline_name).toEqual('Emirates Airlines');
    expect(result.airline_code).toEqual('EK');
    expect(result.contact_info).toEqual('contact@emirates.com');
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should create an airline with null contact_info', async () => {
    const result = await createAirline(testInputMinimal);

    expect(result.airline_name).toEqual('Saudi Airlines');
    expect(result.airline_code).toEqual('SV');
    expect(result.contact_info).toBeNull();
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
  });

  it('should save airline to database', async () => {
    const result = await createAirline(testInput);

    // Query using proper drizzle syntax
    const airlines = await db.select()
      .from(airlinesTable)
      .where(eq(airlinesTable.id, result.id))
      .execute();

    expect(airlines).toHaveLength(1);
    expect(airlines[0].airline_name).toEqual('Emirates Airlines');
    expect(airlines[0].airline_code).toEqual('EK');
    expect(airlines[0].contact_info).toEqual('contact@emirates.com');
    expect(airlines[0].is_active).toEqual(true);
    expect(airlines[0].created_at).toBeInstanceOf(Date);
  });
});

describe('getAirlines', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no airlines exist', async () => {
    const result = await getAirlines();

    expect(result).toEqual([]);
  });

  it('should return all airlines', async () => {
    // Create multiple airlines
    await createAirline(testInput);
    await createAirline(testInputMinimal);

    const result = await getAirlines();

    expect(result).toHaveLength(2);
    expect(result[0].airline_name).toEqual('Emirates Airlines');
    expect(result[1].airline_name).toEqual('Saudi Airlines');
  });

  it('should return airlines with correct field types', async () => {
    await createAirline(testInput);

    const result = await getAirlines();

    expect(result).toHaveLength(1);
    const airline = result[0];
    expect(typeof airline.id).toBe('number');
    expect(typeof airline.airline_name).toBe('string');
    expect(typeof airline.airline_code).toBe('string');
    expect(typeof airline.is_active).toBe('boolean');
    expect(airline.created_at).toBeInstanceOf(Date);
    expect(airline.updated_at).toBeInstanceOf(Date);
  });
});

describe('getAirlineById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return null when airline does not exist', async () => {
    const result = await getAirlineById(999);

    expect(result).toBeNull();
  });

  it('should return airline when it exists', async () => {
    const created = await createAirline(testInput);

    const result = await getAirlineById(created.id);

    expect(result).not.toBeNull();
    expect(result?.airline_name).toEqual('Emirates Airlines');
    expect(result?.airline_code).toEqual('EK');
    expect(result?.contact_info).toEqual('contact@emirates.com');
    expect(result?.is_active).toEqual(true);
    expect(result?.id).toEqual(created.id);
  });

  it('should return correct airline by ID when multiple exist', async () => {
    const airline1 = await createAirline(testInput);
    const airline2 = await createAirline(testInputMinimal);

    const result = await getAirlineById(airline2.id);

    expect(result).not.toBeNull();
    expect(result?.airline_name).toEqual('Saudi Airlines');
    expect(result?.airline_code).toEqual('SV');
    expect(result?.contact_info).toBeNull();
    expect(result?.id).toEqual(airline2.id);
  });

  it('should return airline with correct field types', async () => {
    const created = await createAirline(testInput);

    const result = await getAirlineById(created.id);

    expect(result).not.toBeNull();
    expect(typeof result!.id).toBe('number');
    expect(typeof result!.airline_name).toBe('string');
    expect(typeof result!.airline_code).toBe('string');
    expect(typeof result!.is_active).toBe('boolean');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.updated_at).toBeInstanceOf(Date);
  });
});