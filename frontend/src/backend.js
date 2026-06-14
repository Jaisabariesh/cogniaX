import axios from 'axios';
const BASE_URL = 'http://localhost:3000';

// CREATE a new note
export async function createNote(uid, title, content) {
  try {
    const res = await axios.post(`${BASE_URL}/notes/${uid}`, {
      title,
      content,
    });
    return res.data;
  } catch (err) {
    console.error('❌ Error creating note:', err.response?.data || err.message);
  }
}

// GET note titles for a UID
export async function getNoteTitles(uid) {
  try {
    const res = await axios.get(`${BASE_URL}/notes-name/${uid}`);
    return res.data;
  } catch (err) {
    console.error('❌ Error fetching note titles:', err.response?.data || err.message);
  }
}
