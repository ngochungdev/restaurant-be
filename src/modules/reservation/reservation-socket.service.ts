import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server as HttpServer } from 'node:http';
import { Server as SocketIoServer, Socket } from 'socket.io';
import { Reservation } from './entities/reservation.entity';

type ReservationSocketAction =
  | 'created'
  | 'updated'
  | 'accepted'
  | 'rejected'
  | 'deleted';

type ReservationsUpdatedPayload = {
  action: ReservationSocketAction;
  reservation?: Partial<Reservation> | { id: number };
  reservations: Array<Reservation & { reservationDateLocal?: string | null }>;
};

@Injectable()
export class ReservationSocketService {
  private readonly logger = new Logger(ReservationSocketService.name);
  private server?: SocketIoServer;

  constructor(private readonly jwtService: JwtService) {}

  attach(httpServer: HttpServer) {
    if (this.server) {
      return;
    }

    this.server = new SocketIoServer(httpServer, {
      cors: {
        origin: '*',
        credentials: true,
        methods: ['GET', 'POST'],
        allowedHeaders: ['Content-Type', 'Authorization'],
      },
    });

    this.server.on('connection', (socket) => this.handleConnection(socket));
  }

  emitReservationsUpdated(payload: ReservationsUpdatedPayload) {
    this.server?.to('admins').emit('reservations:updated', payload);
    this.server?.emit(`reservation:${payload.action}`, {
      action: payload.action,
      reservationId: payload.reservation?.id,
    });
  }

  private handleConnection(socket: Socket) {
    const token = this.extractToken(socket);

    if (!token) {
      socket.emit('reservations:connected', { ok: true, role: 'guest' });
      return;
    }

    try {
      const payload = this.jwtService.verify<{ role?: string }>(token);

      if (payload.role !== 'ADMIN') {
        socket.emit('reservations:auth_error', {
          code: 'ADMIN_REQUIRED',
          message: 'Admin role required',
        });
        return;
      }

      socket.data.user = payload;
      socket.join('admins');
      socket.emit('reservations:connected', { ok: true, role: 'admin' });
    } catch (error) {
      const authError = this.toAuthError(error);

      if (authError.data?.code !== 'TOKEN_EXPIRED') {
        this.logger.warn(`Rejected reservation socket: ${authError.message}`);
      }

      socket.emit('reservations:auth_error', {
        code: authError.data?.code,
        message: authError.message,
      });
    }
  }

  private toAuthError(error: unknown) {
    const name = error instanceof Error ? error.name : undefined;

    if (name === 'TokenExpiredError') {
      return this.createAuthError('TOKEN_EXPIRED', 'Token expired');
    }

    return this.createAuthError('TOKEN_INVALID', 'Invalid token');
  }

  private createAuthError(code: string, message: string) {
    const error = new Error(message) as Error & { data?: { code: string } };
    error.data = { code };

    return error;
  }

  private extractToken(socket: Socket) {
    const auth = socket.handshake.auth as { token?: string } | undefined;
    const queryToken = socket.handshake.query.token;
    const header = socket.handshake.headers.authorization;
    const rawToken =
      auth?.token ||
      (typeof queryToken === 'string' ? queryToken : undefined) ||
      (Array.isArray(queryToken) ? queryToken[0] : undefined) ||
      header;

    if (!rawToken) {
      return undefined;
    }

    return rawToken.replace(/^Bearer\s+/i, '');
  }
}
