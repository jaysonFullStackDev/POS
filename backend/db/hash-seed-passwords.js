// db/hash-seed-passwords.js
// Run with: node db/hash-seed-passwords.js
// Generates bcrypt hashes for seeding the database with real passwords.

const bcrypt = require('bcryptjs');
const pool   = require('./pool');

const SALT_ROUNDS = 10;

const users = [
  { email: 'admin@brewpos.com',   password: 'Admin@123' },
  { email: 'manager@brewpos.com', password: 'Manager@123' },
  { email: 'cashier@brewpos.com', password: 'Cashier@123' },
];

async function hashAndUpdate() {
  console.log('🔐  Generating password hashes...\n');

  for (const user of users) {
    const hash = await bcrypt.hash(user.password, SALT_ROUNDS);
    console.log(`Email:    ${user.email}`);
    console.log(`Password: ${user.password}`);
    console.log(`Hash:     ${hash}`);

    await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [hash, user.email]
    );
    console.log('✅  Updated in database\n');
  }

  console.log('Done! All seed passwords have been hashed.');
  process.exit(0);
}

hashAndUpdate().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
