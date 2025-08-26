import bcrypt from 'bcryptjs';

async function generateHash() {
  const hash = await bcrypt.hash('Famous2016?', 12);
  console.log('Password hash for Famous2016?:', hash);
}

generateHash();