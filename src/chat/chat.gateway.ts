import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { PrismaService } from 'src/prisma/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';

@WebSocketGateway({ cors: true })
export class ChatGateway {
  constructor(private readonly prisma: PrismaService) {}

  private readonly logger = new Logger('ChatGateway');
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected to ${client.id}`);
  }

  @SubscribeMessage('joinChatRoom')
  async joinRoom(
    @MessageBody()
    data: { userId: string; manongId: string; serviceRequestId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `chat:${data.manongId}-${data.serviceRequestId}`;
    await client.join(room);
    this.logger.log(`Client ${client.id} joined the chat room ${room}`);

    // Get messages from database
    const messages = await this.prisma.message.findMany({
      where: {
        room_id: room,
      },
      include: {
        attachment: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Transform database records to match Flutter expectations
    const transformedMessages = messages.map((message) => ({
      id: message.id,
      roomId: message.room_id,
      senderId: message.sender_id,
      content: message.content,
      attachments:
        message.attachment && message.attachment.length > 0
          ? message.attachment.map((att) => ({
              id: att.id,
              type: att.type,
              url: att.url,
            }))
          : [],
      createdAt: message.createdAt.toISOString(),
    }));

    this.logger.log(`Sending ${transformedMessages.length} messages to client`);
    client.emit('chat:history', transformedMessages);
  }

  @SubscribeMessage('leaveChatRoom')
  async leaveRoom(
    @MessageBody()
    data: { userId: string; manongId: string; serviceRequestId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `chat:${data.manongId}-${data.serviceRequestId}`;
    await client.leave(room);
    this.logger.log(`Client ${client.id} left the chat room ${room}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody()
    data: {
      userId: string;
      manongId: string;
      serviceRequestId: string;
      content: string;
      attachments?: { type: string; url: string }[];
    },
  ) {
    const room = `chat:${data.manongId}-${data.serviceRequestId}`;

    const message = await this.prisma.message.create({
      data: {
        room_id: room,
        sender_id: data.userId,
        content: data.content,
      },
    });

    const payload = {
      id: message.id,
      roomId: room,
      senderId: data.userId,
      content: data.content,
      attachments: [], // Initially empty, will be updated when images are uploaded
      createdAt: message.createdAt,
    };

    this.server.to(room).emit('chat:update', payload);
    this.logger.log(`Chat update for ${room}: ${JSON.stringify(payload)}`);

    return payload;
  }

  @OnEvent('chat.message.updated')
  async handleAttachmentUpdate(payload: {
    messageId: number;
    attachments: any[];
  }) {
    const message = await this.prisma.message.findUnique({
      where: { id: payload.messageId },
      include: { attachment: true },
    });

    if (!message) return;

    const updatedPayload = {
      id: message.id,
      roomId: message.room_id,
      senderId: message.sender_id,
      content: message.content,
      attachments: message.attachment.map((att) => ({
        id: att.id,
        type: att.type,
        url: att.url,
      })),
      createdAt: message.createdAt,
    };

    this.server.to(message.room_id).emit('chat:update', updatedPayload);
  }
}
