// Emergency unlock for when the ONLY admin is locked out (an admin can normally unlock staff
// from Admin → Staff users). Usage:  npm run unlock -- admin@tours.local  [new-password]
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();
const [email, password] = process.argv.slice(2);

async function main() {
  if (!email) throw new Error("Usage: npm run unlock -- <email> [new-password]");
  const user = await db.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) throw new Error(`No staff account with email ${email}`);
  await db.user.update({
    where: { id: user.id },
    data: { failedLogins: 0, lockedAt: null, ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}) },
  });
  console.log(`Unlocked ${user.email}${password ? " and set a new password" : ""}.`);
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
