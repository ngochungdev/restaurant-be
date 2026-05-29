import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from './modules/users/users.service';
import { ConfigService } from '@nestjs/config';

async function ensureAdminUser(app: any) {
  const usersService = app.get(UsersService);
  const configService = app.get(ConfigService);

  const adminUsername = configService.get('ADMIN_USERNAME') || 'admin';
  const adminPassword = configService.get('ADMIN_PASSWORD') || 'admin123';

  const existing = await usersService.findByUsername(adminUsername);
  if (existing) {
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await usersService.create({
    username: adminUsername,
    password: passwordHash,
    role: 'ADMIN',
  });
}

async function bootstrap() {
  // Set Fastify body size limit directly — no need to import express.
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ bodyLimit: 10 * 1024 * 1024 }),
  );

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  app.enableCors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  await ensureAdminUser(app);

  // Only expose Swagger in non-production to avoid keeping the full UI in memory.
  if (process.env.NODE_ENV !== 'production') {
    const { SwaggerModule, DocumentBuilder } = await import('@nestjs/swagger');
    const config = new DocumentBuilder()
      .setTitle('Restaurant API')
      .setDescription('Auth + Menu + Reservation API')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Server running on port ${port}`);
}
bootstrap();
