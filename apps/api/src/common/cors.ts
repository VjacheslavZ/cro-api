import { ForbiddenException, type INestApplication } from '@nestjs/common';

// Any port on localhost or on a private network address, so that the apps can
// be opened from a phone on the same Wi-Fi during development.
const LOCAL_NETWORK_ORIGIN = /^http:\/\/(localhost|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+):\d+$/;

export interface CorsSettings {
  /** Origins of the web app and the admin panel. */
  origins: string[];
  /** Also allows the local network origins. Never enable it in production. */
  allowLocalNetwork: boolean;
}

/**
 * Lets the web app and the admin panel call the API from the browser, with
 * cookies.
 *
 * A request with any other Origin header is refused with 403 before it
 * reaches a route. Browsers only stop a page from reading a cross-origin
 * response, so refusing the request here also keeps it from running.
 * ForbiddenException is an expected outcome for Nest, unlike a plain Error:
 * it becomes a 403 and is not logged. Scanners probing the API from other
 * origins therefore add no 5xx responses or error lines, which alarms count.
 * Requests without an Origin header, such as health checks, are not affected.
 */
export function enableCors(
  app: INestApplication,
  { origins, allowLocalNetwork }: CorsSettings,
): void {
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (
        !origin ||
        origins.includes(origin) ||
        (allowLocalNetwork && LOCAL_NETWORK_ORIGIN.test(origin))
      ) {
        callback(null, true);
      } else {
        callback(new ForbiddenException('Not allowed by CORS'));
      }
    },
    credentials: true,
  });
}
