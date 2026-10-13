import { NextRequest, NextResponse } from 'next/server';
import { checkDomainAvailability } from '@/lib/resellerclub/client';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain');
    const tldsParam = searchParams.get('tlds');

    if (!domain) {
      return NextResponse.json(
        { error: 'Domain query parameter is required' },
        { status: 400 }
      );
    }

    const tlds = tldsParam
      ? tldsParam.split(',').map(t => t.trim())
      : ['com', 'in', 'net', 'org', 'co.in'];

    const results = await checkDomainAvailability(domain, tlds);

    return NextResponse.json({
      success: true,
      query: domain,
      results,
    });
  } catch (error: any) {
    console.error('API /api/domains/search error:', error);
    return NextResponse.json(
      {
        error: error.message || 'Failed to check domain availability',
      },
      { status: 500 }
    );
  }
}
