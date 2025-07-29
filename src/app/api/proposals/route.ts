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
    const participantId = searchParams.get('participantId');

    const db = await getDatabase();
    let query: any = {};
    
    if (competitionId) query.competitionId = new ObjectId(competitionId);
    if (participantId) query.participantId = new ObjectId(participantId);
    
    const proposals = await db.collection('proposals')
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
        {
          $lookup: {
            from: 'participants',
            localField: 'participantId',
            foreignField: '_id',
            as: 'participant'
          }
        },
        { $unwind: '$competition' },
        { $unwind: '$participant' },
        { $sort: { createdAt: -1 } }
      ])
      .toArray();

    return NextResponse.json(proposals);
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

    const proposal = {
      ...body,
      competitionId: new ObjectId(body.competitionId),
      participantId: new ObjectId(body.participantId),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (body.status === 'submitted') {
      proposal.submittedAt = new Date();
    }

    const result = await db.collection('proposals').insertOne(proposal);

    // Create notification
    await db.collection('notifications').insertOne({
      type: 'proposal_update',
      title: 'Proposal Baru',
      message: `Proposal "${body.title}" telah ${body.status === 'submitted' ? 'disubmit' : 'dibuat'}`,
      data: { proposalId: result.insertedId },
      read: false,
      createdAt: new Date(),
    });

    return NextResponse.json({ ...proposal, _id: result.insertedId });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { _id, ...updateData } = body;
    const db = await getDatabase();

    // Get original proposal
    const originalProposal = await db.collection('proposals').findOne({ _id: new ObjectId(_id) });
    if (!originalProposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Check if status changed
    const statusChanged = originalProposal.status !== updateData.status;
    
    // Update timestamps based on status
    if (updateData.status === 'submitted' && originalProposal.status !== 'submitted') {
      updateData.submittedAt = new Date();
    }
    if (['approved', 'rejected'].includes(updateData.status) && !['approved', 'rejected'].includes(originalProposal.status)) {
      updateData.reviewedAt = new Date();
    }

    updateData.updatedAt = new Date();

    const result = await db.collection('proposals').updateOne(
      { _id: new ObjectId(_id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    // Create notification if status changed
    if (statusChanged) {
      await db.collection('notifications').insertOne({
        type: 'proposal_update',
        title: 'Status Proposal Berubah',
        message: `Proposal "${originalProposal.title}" status berubah menjadi ${updateData.status}`,
        data: { 
          proposalId: _id, 
          oldStatus: originalProposal.status, 
          newStatus: updateData.status 
        },
        read: false,
        createdAt: new Date(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const result = await db.collection('proposals').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}