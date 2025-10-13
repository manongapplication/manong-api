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
import { FcmService } from 'src/fcm/fcm.service';
import { CreateNotificationDto } from 'src/fcm/dto/create-notification.dto';
import { UserService } from 'src/user/user.service';
import { ServiceRequestService } from 'src/service-request/service-request.service';

@WebSocketGateway({ cors: true })
export class ChatGateway {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fcmService: FcmService,
    private readonly serviceRequestService: ServiceRequestService,
    private readonly userService: UserService,
  ) {}

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
    data: {
      senderId: number;
      receiverId: number;
      userId: number;
      manongId: number;
      serviceRequestId: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `chat:${data.userId}-${data.manongId}-${data.serviceRequestId}`;
    await client.join(room);
    this.logger.log(`Client ${client.id} joined the chat room ${room}`);

    // Get messages from database
    const messages = await this.prisma.message.findMany({
      where: {
        roomId: room,
      },
      include: {
        attachment: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    await this.prisma.message.updateMany({
      where: {
        receiverId: data.senderId,
        seenAt: null,
      },
      data: {
        seenAt: new Date(),
      },
    });

    // Transform database records to match Flutter expectations
    const transformedMessages = messages.map((message) => ({
      id: message.id,
      roomId: message.roomId,
      senderId: message.senderId,
      receiverId: message.receiverId,
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
    data: {
      userId: number;
      manongId: number;
      serviceRequestId: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `chat:${data.userId}-${data.manongId}-${data.serviceRequestId}`;
    await client.leave(room);
    this.logger.log(`Client ${client.id} left the chat room ${room}`);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @MessageBody()
    data: {
      senderId: number;
      receiverId: number;
      userId: number;
      manongId: number;
      serviceRequestId: number;
      content: string;
      attachments?: { type: string; url: string }[];
    },
  ) {
    const room = `chat:${data.userId}-${data.manongId}-${data.serviceRequestId}`;

    const message = await this.prisma.message.create({
      data: {
        roomId: room,
        senderId: data.senderId,
        receiverId: data.receiverId,
        content: data.content,
        serviceRequestId: data.serviceRequestId,
      },
    });

    const payload = {
      id: message.id,
      roomId: room,
      senderId: data.senderId,
      receiverId: data.receiverId,
      content: data.content,
      attachments: [], // Initially empty, will be updated when images are uploaded
      createdAt: message.createdAt,
    };

    try {
      const isManong = data.userId == data.receiverId;

      const serviceRequest =
        await this.serviceRequestService.findByIdIncludesUserAndManong(
          Number(data.serviceRequestId),
        );

      const receiverFcmToken = isManong
        ? serviceRequest?.user.fcmToken
        : serviceRequest?.manong?.fcmToken;

      const senderName = isManong
        ? serviceRequest?.manong?.firstName?.trim()
          ? serviceRequest.manong.firstName.trim()
          : (serviceRequest?.manong?.phone?.toString() ?? 'Manong')
        : serviceRequest?.user?.firstName?.trim()
          ? serviceRequest.user.firstName.trim()
          : (serviceRequest?.user?.phone?.toString() ?? 'User');

      const receiverId = isManong
        ? serviceRequest?.userId
        : serviceRequest?.manongId;

      const hasAttachment = !!data.attachments?.length;
      const bodyText = hasAttachment
        ? `${senderName} sent an attachment`
        : data.content?.trim() || 'New message received';

      const notificationDto: CreateNotificationDto = {
        token: receiverFcmToken ?? '',
        title: `From ${senderName}`,
        body: bodyText,
        userId: receiverId ?? -1,
      };

      await this.fcmService.sendPushNotification(notificationDto, {
        type: 'chat',
        messageId: message.id,
        roomId: room,
      });
    } catch (e) {
      this.logger.error(`Can't message notification ${e}`);
    }

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
      roomId: message.roomId,
      senderId: message.senderId,
      receiverId: message.receiverId,
      content: message.content,
      attachments: message.attachment.map((att) => ({
        id: att.id,
        type: att.type,
        url: att.url,
      })),
      createdAt: message.createdAt,
    };

    this.server.to(message.roomId).emit('chat:update', updatedPayload);
  }
}
