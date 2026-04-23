import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { hash } from "bcryptjs";

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@lianci.cloud";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123456";
  const name = process.env.SEED_ADMIN_NAME ?? "Admin";

  const existed = await prisma.user.findUnique({ where: { email } });
  if (existed) {
    console.log("[seed] admin exists, skip:", email);
    return;
  }

  const passwordHash = await hash(password, 12);

  await prisma.user.create({
    data: {
      email,
      name,
      password: passwordHash,
      role: "ADMIN",
    },
  });

  console.log("[seed] admin created:", email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
