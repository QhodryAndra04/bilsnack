import { NextResponse } from 'next/server';
import { computeShippingFee } from '../../../services/shippingService';

export async function POST(request) {
  try {
    const { city, postalCode, shippingMethod } = await request.json();

    if (!city || !shippingMethod) {
      return NextResponse.json(
        { error: 'City and shipping method are required' },
        { status: 400 }
      );
    }

    const result = computeShippingFee({ city, postalCode, method: shippingMethod });

    if (!result.available) {
      return NextResponse.json(
        { error: `Shipping method ${shippingMethod} is not available for this location` },
        { status: 400 }
      );
    }

    // Return fee per store (since checkout handles multiple stores)
    return NextResponse.json({
      feePerStore: result.fee,
      distanceKm: result.distanceKm,
      method: result.method
    });
  } catch (error) {
    console.error('Shipping quote error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate shipping fee' },
      { status: 500 }
    );
  }
}