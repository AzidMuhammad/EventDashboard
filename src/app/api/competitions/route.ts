import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDatabase();
    const competitions = await db.collection('competitions')
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    const serializedCompetitions = competitions.map(comp => ({
      ...comp,
      _id: comp._id.toString()
    }));

    return NextResponse.json(serializedCompetitions);
  } catch (error) {
    console.error('Error fetching competitions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    const requiredFields = ['name', 'description', 'category', 'startDate', 'endDate', 'maxParticipants'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    const db = await getDatabase();

    const competition = {
      name: body.name,
      description: body.description,
      category: body.category,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      maxParticipants: parseInt(body.maxParticipants),
      currentParticipants: 0,
      status: body.status || 'draft',
      prizes: {
        first: body.prizes?.first || '',
        second: body.prizes?.second || '',
        third: body.prizes?.third || ''
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (competition.startDate >= competition.endDate) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
    }

    const result = await db.collection('competitions').insertOne(competition);

    await db.collection('notifications').insertOne({
      type: 'system',
      title: 'Lomba Baru Dibuat',
      message: `Lomba "${body.name}" telah dibuat`,
      data: { competitionId: result.insertedId.toString() },
      read: false,
      createdAt: new Date(),
    });

    return NextResponse.json({ 
      ...competition, 
      _id: result.insertedId.toString(),
      startDate: competition.startDate.toISOString(),
      endDate: competition.endDate.toISOString()
    });
  } catch (error) {
    console.error('Error creating competition:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}