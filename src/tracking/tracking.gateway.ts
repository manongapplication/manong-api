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
  private readonly ARRIVAL_THRESHOLD = 50;

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

    await this.checkArrival(data);
  }

  private async checkArrival(data: {
    manongId: string;
    serviceRequestId: string;
    lat: number;
    lng: number;
  }) {
    try {
      const requestId = parseInt(data.serviceRequestId, 10);
      const serviceRequest =
        await this.serviceRequestService.findById(requestId);

      if (!serviceRequest) return;

      // Skip if already arrived
      if (serviceRequest.arrivedAt) return;

      // Calculate distance using Haversine formula
      const distance = this.calculateDistance(
        data.lat,
        data.lng,
        Number(serviceRequest.customerLat),
        Number(serviceRequest.customerLng),
      );

      this.logger.debug(
        `Distance to destination: ${distance.toFixed(2)} meters`,
      );

      // If within threshold, mark as arrived
      if (distance <= this.ARRIVAL_THRESHOLD) {
        await this.serviceRequestService.markAsArrived(requestId);

        const room = `tracking:${data.manongId}-${data.serviceRequestId}`;
        this.server.to(room).emit('arrival:detected', {
          serviceRequestId: data.serviceRequestId,
          manongId: data.manongId,
          arrivedAt: new Date().toISOString(),
          distance: distance,
          message: 'Manong has arrived at the location',
        });

        this.logger.log(
          `✅ Arrival detected for request ${requestId} (${distance.toFixed(2)}m)`,
        );
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(`Error checking arrival: ${errorMessage}`);
    }
  }

  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = this.toRadians(lat1);
    const φ2 = this.toRadians(lat2);
    const Δφ = this.toRadians(lat2 - lat1);
    const Δλ = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  private toRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
  }
}
