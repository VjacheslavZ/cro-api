import { networkInterfaces } from 'os';

import { SWAGGER_PATH } from './swagger';

interface AddressLogOptions {
  port: number;
  webUrl: string;
  adminUrl: string;
  swaggerEnabled: boolean;
  /**
   * Shown under Local only: docker-compose.yml publishes Grafana on
   * 127.0.0.1, so other devices on the network cannot open it.
   */
  grafanaUrl?: string;
  /** REDIS_URL. Only its host and port are printed, never a password. */
  redisUrl?: string;
}

/** Host and port of a redis:// or rediss:// URL, without credentials. */
export function redisAddress(redisUrl: string): string {
  const { hostname, port } = new URL(redisUrl);
  return `${hostname}:${port || '6379'}`;
}

export function logAddresses({
  port,
  webUrl,
  adminUrl,
  swaggerEnabled,
  grafanaUrl,
  redisUrl,
}: AddressLogOptions): void {
  const webPort = new URL(webUrl).port;
  const adminPort = new URL(adminUrl).port;

  const lanIp = Object.values(networkInterfaces())
    .flat()
    .find((i) => i && i.family === 'IPv4' && !i.internal)?.address;

  console.log('\n  Local:');
  console.log(`    🚀 API:     http://localhost:${port}`);
  if (swaggerEnabled) console.log(`    📖 Swagger: http://localhost:${port}/${SWAGGER_PATH}`);
  console.log(`    🌐 Web:     ${webUrl}`);
  console.log(`    🔧 Admin:   ${adminUrl}`);
  if (grafanaUrl) console.log(`    📊 Grafana: ${grafanaUrl}`);
  if (redisUrl) console.log(`    🧱 Redis:   ${redisAddress(redisUrl)}`);

  if (lanIp) {
    console.log('\n  Network:');
    console.log(`    🚀 API:     http://${lanIp}:${port}`);
    if (swaggerEnabled) console.log(`    📖 Swagger: http://${lanIp}:${port}/${SWAGGER_PATH}`);
    console.log(`    🌐 Web:     http://${lanIp}:${webPort}`);
    console.log(`    🔧 Admin:   http://${lanIp}:${adminPort}`);
  }

  console.log('');
}
