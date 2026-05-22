// frontend/index.js

const axios = require('axios');
const BASE_URL = 'http://localhost:3000';

// CREATE a new note
async function createNote(uid, title, content) {
  try {
    const res = await axios.post(`${BASE_URL}/notes/${uid}`, {
      title,
      content,
    });
    console.log('✅ Note created:', res.data);
  } catch (err) {
    console.error('❌ Error creating note:', err.response?.data || err.message);
  }
}

// GET note titles for a UID
async function getNoteTitles(uid) {
  try {
    const res = await axios.get(`${BASE_URL}/notes-name/${uid}`);
    console.log(`📄 Titles for ${uid}:`);
    res.data.forEach(note => console.log(`- ${note.title} (ID: ${note.id})`));
  } catch (err) {
    console.error('❌ Error fetching note titles:', err.response?.data || err.message);
  }
}


