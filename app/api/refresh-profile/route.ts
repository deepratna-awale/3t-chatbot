import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { getProfileData } from '@/lib/data/profile';

export async function POST(request: NextRequest) {
  try {
    // Force refresh the profile data
    const data = await getProfileData(true);

    return NextResponse.json({
      success: true,
      message: 'Profile data refreshed successfully',
      lastUpdated: data.github.lastUpdated,
      repoCount: data.github.repos.length,
    });
  } catch (error) {
    console.error('Error refreshing profile data:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to refresh profile data' },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const data = await getProfileData();

    return NextResponse.json({
      success: true,
      data: {
        lastUpdated: data.github.lastUpdated,
        repoCount: data.github.repos.length,
        location: data.github.location,
        followers: data.github.followers,
        publicRepos: data.github.publicRepos,
      },
    });
  } catch (error) {
    console.error('Error getting profile data:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to get profile data' },
      { status: 500 },
    );
  }
}
