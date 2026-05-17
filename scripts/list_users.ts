import { adminAuth } from "../src/infrastructure/firebase/admin";
async function list() {
  const result = await adminAuth.listUsers(100);
  result.users.forEach(u => console.log(u.email));
  process.exit(0);
}
list();
