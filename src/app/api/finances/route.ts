import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Import your auth options
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const db = await getDatabase();
    let query: any = {};
    
    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    const finances = await db.collection('finances')
      .find(query)
      .sort({ date: -1 })
      .toArray();

    return NextResponse.json(finances);
  } catch (error) {
    console.error('GET /api/finances error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Debug logging
    console.log('Session:', JSON.stringify(session, null, 2));
    
    if (!session) {
      return NextResponse.json({ error: 'No session found' }, { status: 401 });
    }

    if (!session.user) {
      return NextResponse.json({ error: 'No user in session' }, { status: 401 });
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ 
        error: 'Admin access required',
        userRole: session.user.role 
      }, { status: 403 });
    }

    const body = await request.json();
    const db = await getDatabase();

    const finance = {
      ...body,
      amount: Number(body.amount), // Ensure amount is a number
      date: new Date(body.date || Date.now()),
      source: body.source || 'manual',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await db.collection('finances').insertOne(finance);

    // Create notification
    await db.collection('notifications').insertOne({
      type: 'finance_update',
      title: `${body.type === 'income' ? 'Pemasukan' : 'Pengeluaran'} Baru`,
      message: `${body.type === 'income' ? 'Dana masuk' : 'Dana keluar'} sebesar Rp ${Number(body.amount).toLocaleString('id-ID')}`,
      data: { financeId: result.insertedId, amount: Number(body.amount), type: body.type },
      read: false,
      createdAt: new Date(),
    });

    return NextResponse.json({ ...finance, _id: result.insertedId });
  } catch (error) {
    console.error('POST /api/finances error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { _id, ...updateData } = body;
    const db = await getDatabase();

    const result = await db.collection('finances').updateOne(
      { _id: new ObjectId(_id) },
      { 
        $set: { 
          ...updateData,
          amount: Number(updateData.amount),
          date: new Date(updateData.date),
          updatedAt: new Date() 
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Finance record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUT /api/finances error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const db = await getDatabase();
    const result = await db.collection('finances').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Finance record not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/finances error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}