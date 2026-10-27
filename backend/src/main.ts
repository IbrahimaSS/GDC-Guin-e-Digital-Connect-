import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

/** Réglages communs à l'application et aux tests e2e. */
export function configurerApp(
  app: Awaited<ReturnType<typeof NestFactory.create>>,
) {
  const config = app.get(ConfigService);
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: config.get<string[]>('corsOrigin'),
    credentials: true,
  });
  app.enableShutdownHooks();
  return app;
}

async function bootstrap() {
  const app = configurerApp(await NestFactory.create(AppModule));
  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('GDC – Guinée Digital Connect')
      .setDescription(
        'API de la plateforme : comptes, techniciens, demandes, devis, paiements, messagerie.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('api/docs', app, document);

  const port = app.get(ConfigService).get<number>('port') ?? 4000;
  await app.listen(port);
  new Logger('GDC').log(
    `API prête sur http://localhost:${port}/api — documentation : /api/docs`,
  );
}

if (process.env.NODE_ENV !== 'test') await bootstrap();
