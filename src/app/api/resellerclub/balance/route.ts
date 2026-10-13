import { NextResponse } from 'next/server';
import { getServerSession, AuthOptions } from 'next-auth';
import { options } from '@/app/api/auth/[...nextauth]/options';
import { resellerClubRequest, getResellerClubConfig } from '@/lib/resellerclub/client';

export async function GET() {
  try {
    const session = await getServerSession(options as AuthOptions);
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const config = getResellerClubConfig();
    const balanceData = await resellerClubRequest(
      '/billing/reseller-balance.json',
      'GET',
      { 'reseller-id': config.resellerId }
    );

    return NextResponse.json({
      success: true,
      resellerId: config.resellerId,
      currency: balanceData.sellingcurrencysymbol,
      balance: balanceData.sellingcurrencybalance,
      lockedBalance: balanceData.sellingcurrencylockedbalance,
    });
  } catch (error: any) {
    console.error('Error fetching ResellerClub balance:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch ResellerClub balance' },
      { status: 500 }
    );
  }
}
