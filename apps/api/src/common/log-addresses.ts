import { networkInterfaces } from 'os';

interface AddressLogOptions {
  port: number;
  webUrl: string;
  adminUrl: string;
}

export function logAddresses({ port, webUrl, adminUrl }: AddressLogOptions): void {
  const webPort = new URL(webUrl).port;
  const adminPort = new URL(adminUrl).port;

  const lanIp = Object.values(networkInterfaces())
    .flat()
    .find((i) => i && i.family === 'IPv4' && !i.internal)?.address;

  console.log('\n  Local:');
  console.log(`    🚀 API:     http://localhost:${port}`);
  console.log(`    📖 Swagger: http://localhost:${port}/api/docs`);
  console.log(`    🌐 Web:     ${webUrl}`);
  console.log(`    🔧 Admin:   ${adminUrl}`);

  if (lanIp) {
    console.log('\n  Network:');
    console.log(`    🚀 API:     http://${lanIp}:${port}`);
    console.log(`    📖 Swagger: http://${lanIp}:${port}/api/docs`);
    console.log(`    🌐 Web:     http://${lanIp}:${webPort}`);
    console.log(`    🔧 Admin:   http://${lanIp}:${adminPort}`);
  }

  console.log('');
}
