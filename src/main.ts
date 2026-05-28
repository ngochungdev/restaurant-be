import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import * as bcrypt from 'bcrypt';
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
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('Restaurant API')
    .setDescription('Auth + Menu + Reservation API')
    .setVersion('1.0')
    .addBearerAuth() // JWT auth
    .build();

  // increase request body size limits to avoid PayloadTooLargeError
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await ensureAdminUser(app);

  const document = SwaggerModule.createDocument(app, config);

  app.enableCors({
    origin: 'http://localhost:5173', // frontend URL
    credentials: true, // nếu dùng cookie/auth
  });

  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
}
bootstrap();
