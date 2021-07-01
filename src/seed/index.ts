import * as dotenv from 'dotenv';
import { runServer, closeServer } from '../main';
import { seedAdmin, seedDatabase } from './user-seed';
dotenv.config({ path: './.env' });

(async () => {
  await runServer();
  await seedAdmin();
  await seedDatabase();
  await closeServer();
})();
