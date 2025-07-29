import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid competition ID' }, { status: 400 });
    }

    const db = await getDatabase();
    const competition = await db.collection('competitions').findOne({ 
      _id: new ObjectId(id) 
    });

    if (!competition) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...competition,
      _id: competition._id.toString()
    });
  } catch (error) {
    console.error('Error fetching competition:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid competition ID' }, { status: 400 });
    }

    const body = await request.json();
    
    const requiredFields = ['name', 'description', 'category', 'startDate', 'endDate', 'maxParticipants'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }

    const db = await getDatabase();

    const updateData = {
      name: body.name,
      description: body.description,
      category: body.category,
      startDate: new Date(body.startDate),
      endDate: new Date(body.endDate),
      maxParticipants: parseInt(body.maxParticipants),
      status: body.status || 'draft',
      prizes: {
        first: body.prizes?.first || '',
        second: body.prizes?.second || '',
        third: body.prizes?.third || ''
      },
      updatedAt: new Date()
    };

    if (updateData.startDate >= updateData.endDate) {
      return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 });
    }

    const result = await db.collection('competitions').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }

    await db.collection('notifications').insertOne({
      type: 'system',
      title: 'Lomba Diperbarui',
      message: `Lomba "${body.name}" telah diperbarui`,
      data: { competitionId: id },
      read: false,
      createdAt: new Date(),
    });

    return NextResponse.json({ 
      success: true,
      message: 'Competition updated successfully' 
    });
  } catch (error) {
    console.error('Error updating competition:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid competition ID' }, { status: 400 });
    }

    const db = await getDatabase();

    // Get competition name before deletion
    const competition = await db.collection('competitions').findOne({ 
      _id: new ObjectId(id) 
    });

    if (!competition) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }

    // Delete the competition
    const result = await db.collection('competitions').deleteOne({ 
      _id: new ObjectId(id) 
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }

    // Delete related data
    await Promise.all([
      db.collection('participants').deleteMany({ competitionId: new ObjectId(id) }),
      db.collection('proposals').deleteMany({ competitionId: new ObjectId(id) }),
      db.collection('submissions').deleteMany({ competitionId: new ObjectId(id) })
    ]);

    // Create notification for deletion
    await db.collection('notifications').insertOne({
      type: 'system',
      title: 'Lomba Dihapus',
      message: `Lomba "${competition.name}" telah dihapus`,
      data: { competitionId: id },
      read: false,
      createdAt: new Date(),
    });

    return NextResponse.json({ 
      success: true,
      message: 'Competition deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting competition:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}