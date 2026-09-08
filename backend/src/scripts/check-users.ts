import dotenv from 'dotenv';
dotenv.config();

import { connectDatabase } from '../config/database';
import { User } from '../user/models/User';

async function main() {
  await connectDatabase();
  const users = await User.findAll();
  console.log(`Found ${users.length} members in DB:`);
  for (const u of users) {
    console.log(
      `Member #${u.id}: Name: "${u.full_name}" | Email: "${u.email}" | Phone: "${u.phone}" | Approval Status: "${u.approval_status}"`
    );
  }
  process.exit(0);
}

main().catch(console.error);
