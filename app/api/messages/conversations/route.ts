import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userRole = session.user.role;

    // Get conversations where the user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [
          { participant1Id: userId },
          { participant2Id: userId },
        ],
        status: 'ACTIVE',
      },
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Get participant details for each conversation
    const conversationsWithParticipants = await Promise.all(
      conversations.map(async (conv) => {
        const otherParticipantId = conv.participant1Id === userId 
          ? conv.participant2Id 
          : conv.participant1Id;
        
        const otherParticipantType = conv.participant1Id === userId
          ? conv.participant2Type
          : conv.participant1Type;

        let otherParticipant = null;

        if (otherParticipantType === 'USER' || otherParticipantType === 'PHOTOGRAPHER') {
          otherParticipant = await prisma.user.findUnique({
            where: { id: otherParticipantId },
            select: { id: true, name: true, email: true, avatar: true, role: true },
          });
          
          if (otherParticipantType === 'PHOTOGRAPHER') {
            const photographer = await prisma.photographer.findUnique({
              where: { userId: otherParticipantId },
              select: { id: true, rating: true, status: true },
            });
            otherParticipant = { ...otherParticipant, photographer };
          }
        }

        // Count unread messages
        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            isRead: false,
          },
        });

        return {
          ...conv,
          otherParticipant,
          unreadCount,
        };
      })
    );

    return NextResponse.json(conversationsWithParticipants);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { participantId, participantType, contextType, contextId, initialMessage } = await req.json();
    const userId = session.user.id;
    const userRole = session.user.role as string;

    // Determine participant types
    const participant1Id = userId;
    const participant1Type = userRole === 'PHOTOGRAPHER' ? 'PHOTOGRAPHER' : 
                             userRole === 'ADMIN' ? 'ADMIN' : 'USER';
    const participant2Id = participantId;
    const participant2Type = participantType;

    // Check if conversation already exists
    let conversation = await prisma.conversation.findFirst({
      where: {
        OR: [
          { 
            participant1Id,
            participant1Type,
            participant2Id,
            participant2Type,
          },
          {
            participant1Id: participant2Id,
            participant1Type: participant2Type,
            participant2Id: participant1Id,
            participant2Type: participant1Type,
          },
        ],
      },
    });

    // Create new conversation if doesn't exist
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          participant1Id,
          participant1Type,
          participant2Id,
          participant2Type,
          contextType,
          contextId,
        },
      });
    }

    // Send initial message if provided
    if (initialMessage) {
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          senderId: userId,
          senderType: participant1Type,
          senderName: session.user.name || 'Unknown',
          content: initialMessage,
          messageType: 'TEXT',
        },
      });

      // Update conversation last message
      await prisma.conversation.update({
        where: { id: conversation.id },
        data: {
          lastMessage: initialMessage.substring(0, 100),
          lastMessageAt: new Date(),
        },
      });
    }

    return NextResponse.json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
  }
}
