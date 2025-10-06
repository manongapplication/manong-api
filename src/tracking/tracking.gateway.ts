import { Logger } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ServiceRequestService } from 'src/service-request/service-request.service';
import { UserService } from 'src/user/user.service';

@WebSocketGateway({ cors: true })
export class TrackingGateway {
  constructor(
    private readonly serviceRequestService: ServiceRequestService,
    private readonly userService: UserService,
  ) {}

  private readonly logger = new Logger('Tracking');
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    this.logger.log(`Client connected ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected ${client.id}`);
  }

  @SubscribeMessage('joinTrackingRoom')
  async joinRoom(
    @MessageBody() data: { manongId: string; serviceRequestId: string },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `tracking:${data.manongId}-${data.serviceRequestId}`;
    await client.join(room);
    this.logger.log(`Client ${client.id} joined room ${room}`);
  }

  @SubscribeMessage('leaveTrackingRoom')
  async leaveRoom(
    @MessageBody()
    data: {
      manongId: string;
      serviceRequestId: string;
      lastKnownLat?: number;
      lastKnownLng?: number;
    },
    @ConnectedSocket() client: Socket,
  ) {
    const room = `tracking:${data.manongId}-${data.serviceRequestId}`;
    if (data.lastKnownLat != null || data.lastKnownLng != null) {
      await this.userService.updateLastKnownLatLng(
        parseInt(data.manongId),
        data.lastKnownLat!,
        data.lastKnownLng!,
      );
    }
    await client.leave(room);
    this.logger.log(`Client ${client.id} left the room ${room}`);
  }

  @SubscribeMessage('sendLocation')
  async handleSendLocation(
    @MessageBody()
    data: {
      manongId: string;
      serviceRequestId: string;
      lat: number;
      lng: number;
      status?: string | null;
    },
  ) {
    const room = `tracking:${data.manongId}-${data.serviceRequestId}`;
    const requestId = parseInt(data.serviceRequestId, 10);
    if (isNaN(requestId)) {
      this.logger.warn(`Invalid serviceRequestId: ${data.serviceRequestId}`);
      return;
    }

    const status = await this.serviceRequestService.getStatusById(requestId);
    if (!status) {
      this.logger.warn(
        `No status found for serviceRequestId=${requestId} (manongId=${data.manongId})`,
      );
    }

    const payload = {
      ...data,
      status,
    };

    this.server.to(room).emit('tracking:update', payload);
    this.logger.log(`Location update for ${room}: ${JSON.stringify(payload)}`);
  }
}
