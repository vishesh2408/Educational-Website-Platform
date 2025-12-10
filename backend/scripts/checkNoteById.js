// checkNoteById.js
// Usage: node scripts/checkNoteById.js <noteId>

require('dotenv').config();
const mongoose = require('mongoose');
const Note = require('../models/Note');

async function main() {
  const id = process.argv[2];
  if (!id) {
    console.error('Usage: node scripts/checkNoteById.js <noteId>');
    process.exit(2);
  }

  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI not set in environment or .env');
    process.exit(2);
  }

  try {
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');
    const note = await Note.findById(id).lean();
    if (!note) {
      console.log(`Note with id ${id} not found`);
    } else {
      console.log('Found note:');
      console.log(JSON.stringify(note, null, 2));
    }
    await mongoose.disconnect();
  } catch (err) {
    console.error('Error querying Note:', err && err.message ? err.message : err);
    process.exit(1);
  }
}

main();
