import { execSync } from 'node:child_process';
import 'dotenv/config';

export default function globalSetup(): void {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: process.env,
  });
}
