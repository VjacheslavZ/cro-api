import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_PATH = 'api/docs';

/**
 * Serves the Swagger UI at /api/docs everywhere except production. The docs
 * list every route, including the admin ones, so production does not serve
 * them. Returns whether the docs are served.
 */
export function setupSwagger(app: INestApplication, nodeEnv: string): boolean {
  if (nodeEnv === 'production') {
    return false;
  }

  const config = new DocumentBuilder()
    .setTitle('Croatian Grammar API')
    .setDescription('API for Croatian Grammar learning application')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_PATH, app, document);
  return true;
}
