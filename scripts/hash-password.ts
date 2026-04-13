import { hash } from "bcryptjs";

const password = process.argv[2];
if (!password) {
  console.error("Usage: npx tsx scripts/hash-password.ts <password>");
  process.exit(1);
}

hash(password, 12).then((h) => {
  console.log(h);
});
