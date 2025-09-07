import { db } from '../db';
import { laSimulationsTable, usersTable } from '../db/schema';
import { type LASimulation, type CreateLASimulationInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function createLASimulation(input: CreateLASimulationInput, userId: number): Promise<LASimulation> {
  try {
    // Calculate derived values
    const totalCost = input.accommodation_cost + input.transportation_cost + input.meal_cost + input.guide_cost + input.miscellaneous_cost;
    const costPerPilgrim = totalCost / input.number_of_pilgrims;
    const profitAmount = (costPerPilgrim * input.profit_margin) / 100;
    const sellingPricePerPilgrim = costPerPilgrim + profitAmount;

    // Insert the simulation record
    const result = await db.insert(laSimulationsTable)
      .values({
        simulation_name: input.simulation_name,
        package_type: input.package_type,
        duration_days: input.duration_days,
        number_of_pilgrims: input.number_of_pilgrims,
        accommodation_cost: input.accommodation_cost.toString(),
        transportation_cost: input.transportation_cost.toString(),
        meal_cost: input.meal_cost.toString(),
        guide_cost: input.guide_cost.toString(),
        miscellaneous_cost: input.miscellaneous_cost.toString(),
        total_cost: totalCost.toString(),
        cost_per_pilgrim: costPerPilgrim.toString(),
        profit_margin: input.profit_margin.toString(),
        selling_price_per_pilgrim: sellingPricePerPilgrim.toString(),
        created_by: userId
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const simulation = result[0];
    return {
      ...simulation,
      accommodation_cost: parseFloat(simulation.accommodation_cost),
      transportation_cost: parseFloat(simulation.transportation_cost),
      meal_cost: parseFloat(simulation.meal_cost),
      guide_cost: parseFloat(simulation.guide_cost),
      miscellaneous_cost: parseFloat(simulation.miscellaneous_cost),
      total_cost: parseFloat(simulation.total_cost),
      cost_per_pilgrim: parseFloat(simulation.cost_per_pilgrim),
      profit_margin: parseFloat(simulation.profit_margin),
      selling_price_per_pilgrim: parseFloat(simulation.selling_price_per_pilgrim)
    };
  } catch (error) {
    console.error('LA simulation creation failed:', error);
    throw error;
  }
}

export async function getLASimulations(): Promise<LASimulation[]> {
  try {
    const result = await db.select()
      .from(laSimulationsTable)
      .execute();

    return result.map(simulation => ({
      ...simulation,
      accommodation_cost: parseFloat(simulation.accommodation_cost),
      transportation_cost: parseFloat(simulation.transportation_cost),
      meal_cost: parseFloat(simulation.meal_cost),
      guide_cost: parseFloat(simulation.guide_cost),
      miscellaneous_cost: parseFloat(simulation.miscellaneous_cost),
      total_cost: parseFloat(simulation.total_cost),
      cost_per_pilgrim: parseFloat(simulation.cost_per_pilgrim),
      profit_margin: parseFloat(simulation.profit_margin),
      selling_price_per_pilgrim: parseFloat(simulation.selling_price_per_pilgrim)
    }));
  } catch (error) {
    console.error('Failed to fetch LA simulations:', error);
    throw error;
  }
}

export async function getLASimulationById(id: number): Promise<LASimulation | null> {
  try {
    const result = await db.select()
      .from(laSimulationsTable)
      .where(eq(laSimulationsTable.id, id))
      .execute();

    if (result.length === 0) {
      return null;
    }

    const simulation = result[0];
    return {
      ...simulation,
      accommodation_cost: parseFloat(simulation.accommodation_cost),
      transportation_cost: parseFloat(simulation.transportation_cost),
      meal_cost: parseFloat(simulation.meal_cost),
      guide_cost: parseFloat(simulation.guide_cost),
      miscellaneous_cost: parseFloat(simulation.miscellaneous_cost),
      total_cost: parseFloat(simulation.total_cost),
      cost_per_pilgrim: parseFloat(simulation.cost_per_pilgrim),
      profit_margin: parseFloat(simulation.profit_margin),
      selling_price_per_pilgrim: parseFloat(simulation.selling_price_per_pilgrim)
    };
  } catch (error) {
    console.error('Failed to fetch LA simulation by ID:', error);
    throw error;
  }
}

export async function getLASimulationsByUser(userId: number): Promise<LASimulation[]> {
  try {
    const result = await db.select()
      .from(laSimulationsTable)
      .where(eq(laSimulationsTable.created_by, userId))
      .execute();

    return result.map(simulation => ({
      ...simulation,
      accommodation_cost: parseFloat(simulation.accommodation_cost),
      transportation_cost: parseFloat(simulation.transportation_cost),
      meal_cost: parseFloat(simulation.meal_cost),
      guide_cost: parseFloat(simulation.guide_cost),
      miscellaneous_cost: parseFloat(simulation.miscellaneous_cost),
      total_cost: parseFloat(simulation.total_cost),
      cost_per_pilgrim: parseFloat(simulation.cost_per_pilgrim),
      profit_margin: parseFloat(simulation.profit_margin),
      selling_price_per_pilgrim: parseFloat(simulation.selling_price_per_pilgrim)
    }));
  } catch (error) {
    console.error('Failed to fetch LA simulations by user:', error);
    throw error;
  }
}