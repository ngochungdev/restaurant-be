import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { UsersService } from './modules/users/users.service';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import express from 'express';
import { Readable } from 'stream';

let expressApp: express.Express | null = null;
let initPromise: Promise<void> | null = null;

async function init(): Promise<void> {
  const server = express();
  const nestApp = await NestFactory.create(AppModule, new ExpressAdapter(server), {
    logger: ['error', 'warn'],
  });

  nestApp.use(express.json({ limit: '10mb' }));
  nestApp.use(express.urlencoded({ limit: '10mb', extended: true }));
  nestApp.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  nestApp.enableCors({ origin: '*', credentials: true });

  const usersService = nestApp.get(UsersService);
  const configService = nestApp.get(ConfigService);
  const adminUsername = configService.get('ADMIN_USERNAME') || 'admin';
  const adminPassword = configService.get('ADMIN_PASSWORD') || 'admin123';
  const existing = await usersService.findByUsername(adminUsername);
  if (!existing) {
    const hash = await bcrypt.hash(adminPassword, 10);
    await usersService.create({ username: adminUsername, password: hash, role: 'ADMIN' });
  }

  await nestApp.init();
  expressApp = server;
}

function handleFetch(app: express.Express, request: Request): Promise<Response> {
  return new Promise(async (resolve, reject) => {
    const url = new URL(request.url);
    const isBodyless = request.method === 'GET' || request.method === 'HEAD';
    const bodyBuffer = isBodyless ? Buffer.alloc(0) : Buffer.from(await request.arrayBuffer());

    const readable = new Readable({ read() {} });
    if (bodyBuffer.length > 0) readable.push(bodyBuffer);
    readable.push(null);

    const req: any = Object.assign(readable, {
      method: request.method,
      url: url.pathname + url.search,
      headers: Object.fromEntries(request.headers.entries()),
      httpVersion: '1.1',
      httpVersionMajor: 1,
      httpVersionMinor: 1,
      socket: { remoteAddress: '127.0.0.1', encrypted: false },
      connection: { remoteAddress: '127.0.0.1' },
    });

    const chunks: Buffer[] = [];
    const resHeaders: Record<string, string | string[]> = {};
    const listeners: Record<string, Function[]> = {};

    const res: any = {
      statusCode: 200,
      headersSent: false,
      finished: false,

      writeHead(code: number, hdrs?: any) {
        this.statusCode = code;
        if (hdrs) {
          for (const [k, v] of Object.entries(hdrs)) resHeaders[k.toLowerCase()] = v as string;
        }
        return this;
      },
      setHeader(name: string, value: string | string[]) {
        resHeaders[name.toLowerCase()] = value;
        return this;
      },
      getHeader(name: string) { return resHeaders[name.toLowerCase()]; },
      getHeaders() { return { ...resHeaders }; },
      hasHeader(name: string) { return name.toLowerCase() in resHeaders; },
      removeHeader(name: string) { delete resHeaders[name.toLowerCase()]; },

      write(chunk: Buffer | string) {
        if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        return true;
      },
      end(chunk?: Buffer | string) {
        if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        this.finished = true;
        this.headersSent = true;

        const headers = new Headers();
        for (const [k, v] of Object.entries(resHeaders)) {
          if (Array.isArray(v)) v.forEach((val) => headers.append(k, val));
          else headers.set(k, v);
        }
        resolve(new Response(chunks.length > 0 ? Buffer.concat(chunks) : null, {
          status: this.statusCode,
          headers,
        }));
      },

      on(event: string, fn: Function) {
        (listeners[event] ??= []).push(fn);
        return this;
      },
      once(event: string, fn: Function) { return this.on(event, fn); },
      emit(event: string, ...args: any[]) {
        listeners[event]?.forEach((fn) => fn(...args));
        return true;
      },
      removeListener(event: string, fn: Function) {
        if (listeners[event]) listeners[event] = listeners[event].filter((f) => f !== fn);
        return this;
      },
      flushHeaders() {},
      destroy() {},
    };

    try {
      app(req, res, (err: unknown) => {
        if (err) reject(err);
        else resolve(new Response('Not Found', { status: 404 }));
      });
    } catch (err) {
      reject(err);
    }
  });
}

export default {
  async fetch(request: Request, _env: any, _ctx: any): Promise<Response> {
    if (!initPromise) initPromise = init();
    await initPromise;

    try {
      return await handleFetch(expressApp!, request);
    } catch {
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
