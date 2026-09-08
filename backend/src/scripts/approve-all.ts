import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase } from '../config/database';
import { User } from '../user/models/User';

async function main() {
  await connectDatabase();
  await User.update({ approval_status: 'approved' }, { where: { approval_status: 'pending' } });
  console.log('All pending users approved in DB!');
  process.exit(0);
}

main().catch(console.error);
