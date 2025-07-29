import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const competitionId = searchParams.get('competitionId');

    const db = await getDatabase();
    const query = competitionId ? { competitionId: new ObjectId(competitionId) } : {};
    
    const participants = await db.collection('participants')
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'competitions',
            localField: 'competitionId',
            foreignField: '_id',
            as: 'competition'
          }
        },
        { $unwind: '$competition' },
        { $sort: { createdAt: -1 } }
      ])
      .toArray();

    return NextResponse.json(participants);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const db = await getDatabase();

    // Check if competition exists and has space
    const competition = await db.collection('competitions').findOne({
      _id: new ObjectId(body.competitionId)
    });

    if (!competition) {
      return NextResponse.json({ error: 'Competition not found' }, { status: 404 });
    }

    if (competition.currentParticipants >= competition.maxParticipants) {
      return NextResponse.json({ error: 'Competition is full' }, { status: 400 });
    }

    const participant = {
      ...body,
      competitionId: new ObjectId(body.competitionId),
      registrationDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('participants').insertOne(participant);

    // Update competition participant count
    await db.collection('competitions').updateOne(
      { _id: new ObjectId(body.competitionId) },
      { $inc: { currentParticipants: 1 } }
    );

    // Create notification
    await db.collection('notifications').insertOne({
      type: 'participant_update',
      title: 'Peserta Baru Terdaftar',
      message: `${body.name} mendaftar untuk lomba ${competition.name}`,
      data: { participantId: result.insertedId, competitionId: body.competitionId },
      read: false,
      createdAt: new Date(),
    });

    return NextResponse.json({ ...participant, _id: result.insertedId });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { _id, ...updateData } = body;
    const db = await getDatabase();

    const result = await db.collection('participants').updateOne(
      { _id: new ObjectId(_id) },
      { $set: { ...updateData, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const db = await getDatabase();
    
    // Get participant info before deletion
    const participant = await db.collection('participants').findOne({ _id: new ObjectId(id) });
    if (!participant) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    const result = await db.collection('participants').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Participant not found' }, { status: 404 });
    }

    // Update competition participant count
    await db.collection('competitions').updateOne(
      { _id: participant.competitionId },
      { $inc: { currentParticipants: -1 } }
    );

    // Delete related proposals
    await db.collection('proposals').deleteMany({ participantId: new ObjectId(id) });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}