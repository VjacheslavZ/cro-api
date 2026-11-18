import type { IncomingMessage, ServerResponse } from 'node:http';

import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule, type Params } from 'nestjs-pino';

/** The path of a request URL, without the query string. */
export function requestPath(url: string | undefined): string | undefined {
  return url?.split('?')[0];
}

/**
 * pino settings for the API.
 *
 * Production writes one JSON object per line to stdout, which ECS sends to
 * CloudWatch Logs, where Logs Insights can query every field. Development
 * prints the same records as readable lines through pino-pretty.
 */
export function createLoggerParams(nodeEnv: string): Params {
  const production = nodeEnv === 'production';

  return {
    pinoHttp: {
      level: 'info',
      // A line per finished request, at info level whatever the status: errors
      // are logged once, with their stack, by Nest's exception handler. The
      // load balancer checks /health every few seconds.
      autoLogging: {
        ignore: (request: IncomingMessage) => request.url?.startsWith('/health') ?? false,
      },
      // The default serializers also log every header, including the session
      // cookie, and the client's IP address. The query string is left out too:
      // the OAuth callback carries its authorization code there.
      serializers: {
        req: (request: IncomingMessage & { id?: unknown }) => ({
          id: request.id,
          method: request.method,
          path: requestPath(request.url),
        }),
        res: (response: ServerResponse) => ({ statusCode: response.statusCode }),
      },
      ...(production
        ? {
            // "level":"ERROR" instead of "level":50. The metric filter of the
            // api-error-logs alarm counts lines that contain the text ERROR.
            formatters: { level: (label: string) => ({ level: label.toUpperCase() }) },
          }
        : {
            transport: {
              target: 'pino-pretty',
              options: { singleLine: true, ignore: 'pid,hostname', translateTime: 'HH:MM:ss.l' },
            },
          }),
    },
  };
}

@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createLoggerParams(config.getOrThrow<string>('NODE_ENV')),
    }),
  ],
})
export class LoggingModule {}
