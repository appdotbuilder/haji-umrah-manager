import { db } from '../db';
import { packageBookingsTable, packagesTable, pilgrimsTable } from '../db/schema';
import { type PackageBooking, type CreatePackageBookingInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function createPackageBooking(input: CreatePackageBookingInput): Promise<PackageBooking> {
  try {
    // Validate that package exists
    const packageExists = await db.select()
      .from(packagesTable)
      .where(eq(packagesTable.id, input.package_id))
      .limit(1)
      .execute();

    if (packageExists.length === 0) {
      throw new Error(`Package with ID ${input.package_id} does not exist`);
    }

    // Validate that pilgrim exists
    const pilgrimExists = await db.select()
      .from(pilgrimsTable)
      .where(eq(pilgrimsTable.id, input.pilgrim_id))
      .limit(1)
      .execute();

    if (pilgrimExists.length === 0) {
      throw new Error(`Pilgrim with ID ${input.pilgrim_id} does not exist`);
    }

    // Calculate payment details
    const paidAmount = input.paid_amount || 0;
    const remainingAmount = input.total_amount - paidAmount;
    
    // Determine payment status
    let paymentStatus: 'pending' | 'partial' | 'completed';
    if (paidAmount >= input.total_amount) {
      paymentStatus = 'completed';
    } else if (paidAmount > 0) {
      paymentStatus = 'partial';
    } else {
      paymentStatus = 'pending';
    }

    // Insert booking record
    const result = await db.insert(packageBookingsTable)
      .values({
        package_id: input.package_id,
        pilgrim_id: input.pilgrim_id,
        marketing_partner_id: input.marketing_partner_id,
        total_amount: input.total_amount.toString(),
        paid_amount: paidAmount.toString(),
        remaining_amount: remainingAmount.toString(),
        payment_status: paymentStatus,
        booking_status: 'registered',
        special_requests: input.special_requests
      })
      .returning()
      .execute();

    const booking = result[0];
    return {
      ...booking,
      total_amount: parseFloat(booking.total_amount),
      paid_amount: parseFloat(booking.paid_amount),
      remaining_amount: parseFloat(booking.remaining_amount)
    };
  } catch (error) {
    console.error('Package booking creation failed:', error);
    throw error;
  }
}

export async function getPackageBookings(): Promise<PackageBooking[]> {
  try {
    const results = await db.select()
      .from(packageBookingsTable)
      .execute();

    return results.map(booking => ({
      ...booking,
      total_amount: parseFloat(booking.total_amount),
      paid_amount: parseFloat(booking.paid_amount),
      remaining_amount: parseFloat(booking.remaining_amount)
    }));
  } catch (error) {
    console.error('Failed to fetch package bookings:', error);
    throw error;
  }
}

export async function getPackageBookingById(id: number): Promise<PackageBooking | null> {
  try {
    const results = await db.select()
      .from(packageBookingsTable)
      .where(eq(packageBookingsTable.id, id))
      .limit(1)
      .execute();

    if (results.length === 0) {
      return null;
    }

    const booking = results[0];
    return {
      ...booking,
      total_amount: parseFloat(booking.total_amount),
      paid_amount: parseFloat(booking.paid_amount),
      remaining_amount: parseFloat(booking.remaining_amount)
    };
  } catch (error) {
    console.error('Failed to fetch package booking by ID:', error);
    throw error;
  }
}

export async function updateBookingPayment(id: number, paymentAmount: number): Promise<PackageBooking> {
  try {
    // First, get the current booking to calculate new totals
    const currentBooking = await getPackageBookingById(id);
    if (!currentBooking) {
      throw new Error(`Package booking with ID ${id} does not exist`);
    }

    // Calculate new payment details
    const newPaidAmount = currentBooking.paid_amount + paymentAmount;
    const newRemainingAmount = currentBooking.total_amount - newPaidAmount;
    
    // Determine new payment status
    let paymentStatus: 'pending' | 'partial' | 'completed';
    if (newPaidAmount >= currentBooking.total_amount) {
      paymentStatus = 'completed';
    } else if (newPaidAmount > 0) {
      paymentStatus = 'partial';
    } else {
      paymentStatus = 'pending';
    }

    // Update the booking
    const result = await db.update(packageBookingsTable)
      .set({
        paid_amount: newPaidAmount.toString(),
        remaining_amount: newRemainingAmount.toString(),
        payment_status: paymentStatus,
        updated_at: new Date()
      })
      .where(eq(packageBookingsTable.id, id))
      .returning()
      .execute();

    const updatedBooking = result[0];
    return {
      ...updatedBooking,
      total_amount: parseFloat(updatedBooking.total_amount),
      paid_amount: parseFloat(updatedBooking.paid_amount),
      remaining_amount: parseFloat(updatedBooking.remaining_amount)
    };
  } catch (error) {
    console.error('Failed to update booking payment:', error);
    throw error;
  }
}