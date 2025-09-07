import { db } from '../db';
import { 
  packageBookingsTable, 
  packagesTable, 
  pilgrimsTable 
} from '../db/schema';
import { 
  type SalesTrend, 
  type PackageDistribution, 
  type UnpaidPilgrim, 
  type DateRangeFilter 
} from '../schema';
import { sql, eq, and, gte, lte, ne, count, sum } from 'drizzle-orm';

export async function getSalesTrends(filter: DateRangeFilter): Promise<SalesTrend[]> {
  try {
    // Build conditions array
    const conditions: any[] = [];
    
    if (filter.start_date) {
      conditions.push(gte(packageBookingsTable.booking_date, filter.start_date));
    }
    
    if (filter.end_date) {
      conditions.push(lte(packageBookingsTable.booking_date, filter.end_date));
    }

    // Build query with proper conditional where clause
    const baseQuery = db
      .select({
        period: sql<string>`TO_CHAR(${packageBookingsTable.booking_date}, 'YYYY-MM')`.as('period'),
        total_sales: sql<number>`COALESCE(SUM(${packageBookingsTable.total_amount}), 0)`.as('total_sales'),
        package_count: sql<number>`COUNT(DISTINCT ${packageBookingsTable.package_id})`.as('package_count'),
        pilgrim_count: sql<number>`COUNT(DISTINCT ${packageBookingsTable.pilgrim_id})`.as('pilgrim_count')
      })
      .from(packageBookingsTable);

    const finalQuery = conditions.length > 0 
      ? baseQuery.where(conditions.length === 1 ? conditions[0] : and(...conditions))
      : baseQuery;

    // Execute query with grouping and ordering
    const results = await finalQuery
      .groupBy(sql`TO_CHAR(${packageBookingsTable.booking_date}, 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(${packageBookingsTable.booking_date}, 'YYYY-MM')`)
      .execute();

    return results.map(row => ({
      period: row.period,
      total_sales: parseFloat(row.total_sales.toString()),
      package_count: parseInt(row.package_count.toString()),
      pilgrim_count: parseInt(row.pilgrim_count.toString())
    }));
  } catch (error) {
    console.error('Sales trends query failed:', error);
    throw error;
  }
}

export async function getPackageDistribution(): Promise<PackageDistribution[]> {
  try {
    // Get package distribution by type
    const results = await db
      .select({
        package_type: packagesTable.package_type,
        count: count(packageBookingsTable.id)
      })
      .from(packageBookingsTable)
      .innerJoin(packagesTable, eq(packageBookingsTable.package_id, packagesTable.id))
      .groupBy(packagesTable.package_type)
      .execute();

    // Calculate total bookings for percentage calculation
    const totalBookings = results.reduce((sum, item) => sum + item.count, 0);

    return results.map(row => ({
      package_type: row.package_type.charAt(0).toUpperCase() + row.package_type.slice(1), // Capitalize first letter
      count: row.count,
      percentage: totalBookings > 0 ? parseFloat(((row.count / totalBookings) * 100).toFixed(1)) : 0
    }));
  } catch (error) {
    console.error('Package distribution query failed:', error);
    throw error;
  }
}

export async function getUnpaidPilgrims(): Promise<UnpaidPilgrim[]> {
  try {
    // Get pilgrims with outstanding payments (remaining_amount > 0)
    const results = await db
      .select({
        pilgrim_id: packageBookingsTable.pilgrim_id,
        pilgrim_name: pilgrimsTable.full_name,
        package_name: packagesTable.package_name,
        total_amount: packageBookingsTable.total_amount,
        paid_amount: packageBookingsTable.paid_amount,
        remaining_amount: packageBookingsTable.remaining_amount,
        booking_date: packageBookingsTable.booking_date,
        days_overdue: sql<number>`EXTRACT(DAY FROM (NOW() - ${packageBookingsTable.booking_date}))`.as('days_overdue')
      })
      .from(packageBookingsTable)
      .innerJoin(pilgrimsTable, eq(packageBookingsTable.pilgrim_id, pilgrimsTable.id))
      .innerJoin(packagesTable, eq(packageBookingsTable.package_id, packagesTable.id))
      .where(sql`${packageBookingsTable.remaining_amount} > 0`)
      .orderBy(sql`EXTRACT(DAY FROM (NOW() - ${packageBookingsTable.booking_date})) DESC`)
      .execute();

    return results.map(row => ({
      pilgrim_id: row.pilgrim_id,
      pilgrim_name: row.pilgrim_name,
      package_name: row.package_name,
      total_amount: parseFloat(row.total_amount),
      paid_amount: parseFloat(row.paid_amount),
      remaining_amount: parseFloat(row.remaining_amount),
      booking_date: row.booking_date,
      days_overdue: parseInt(row.days_overdue.toString())
    }));
  } catch (error) {
    console.error('Unpaid pilgrims query failed:', error);
    throw error;
  }
}

export async function getDashboardStats(): Promise<{
  totalRevenue: number;
  totalBookings: number;
  totalPilgrims: number;
  pendingPayments: number;
}> {
  try {
    // Get overall dashboard statistics in parallel queries
    const [revenueResult, bookingsResult, pilgrimsResult, pendingResult] = await Promise.all([
      // Total revenue (sum of all paid amounts)
      db
        .select({
          total: sum(packageBookingsTable.paid_amount)
        })
        .from(packageBookingsTable)
        .execute(),

      // Total bookings count
      db
        .select({
          count: count(packageBookingsTable.id)
        })
        .from(packageBookingsTable)
        .execute(),

      // Total unique pilgrims count
      db
        .select({
          count: sql<number>`COUNT(DISTINCT ${packageBookingsTable.pilgrim_id})`.as('count')
        })
        .from(packageBookingsTable)
        .execute(),

      // Pending payments count (bookings with remaining amount > 0)
      db
        .select({
          count: count(packageBookingsTable.id)
        })
        .from(packageBookingsTable)
        .where(sql`${packageBookingsTable.remaining_amount} > 0`)
        .execute()
    ]);

    return {
      totalRevenue: revenueResult[0]?.total ? parseFloat(revenueResult[0].total.toString()) : 0,
      totalBookings: bookingsResult[0]?.count || 0,
      totalPilgrims: parseInt(pilgrimsResult[0]?.count?.toString() || '0'),
      pendingPayments: pendingResult[0]?.count || 0
    };
  } catch (error) {
    console.error('Dashboard stats query failed:', error);
    throw error;
  }
}