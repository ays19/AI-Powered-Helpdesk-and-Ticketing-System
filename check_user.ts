import { db } from './src/db';

async function checkUser() {
  const user = await db.user.findUnique({
    where: { email: 'sahsanyasir@gmail.com' }
  });
  console.log('User status:', JSON.stringify(user, null, 2));
  process.exit();
}

checkUser();
