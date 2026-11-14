import { networkInterfaces } from 'os';

import { SWAGGER_PATH } from './swagger';

interface AddressLogOptions {
  port: number;
  webUrl: string;
  adminUrl: string;
  swaggerEnabled: boolean;
}

export function logAddresses({ port, webUrl, adminUrl, swaggerEnabled }: AddressLogOptions): void {
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

  if (lanIp) {
    console.log('\n  Network:');
    console.log(`    🚀 API:     http://${lanIp}:${port}`);
    if (swaggerEnabled) console.log(`    📖 Swagger: http://${lanIp}:${port}/${SWAGGER_PATH}`);
    console.log(`    🌐 Web:     http://${lanIp}:${webPort}`);
    console.log(`    🔧 Admin:   http://${lanIp}:${adminPort}`);
  }

  console.log('');
}
