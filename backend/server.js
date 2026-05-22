const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'cognia',
  password: process.env.DB_PASSWORD || 'jai@2009',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  max: 20, // Increase max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.connect((err, client, release) => {
  if (err) {
    return console.error('❌ Error connecting to PostgreSQL:', err.stack);
  }
  console.log('✅ Connected to PostgreSQL!');
  release();
});

// ✅ REQUIRED: Handle idle client errors — without this, any pg error
// on an idle connection emits an unhandled 'error' event and crashes Node.
pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL pool error:', err.message);
});

// Catch any other unhandled errors so the server never silently crashes
process.on('uncaughtException', (err) => {
  console.error('❌ CRITICAL: Uncaught Exception:', err);
  // Ideally, gracefully shut down or alert, but for now we log everything
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
});

// Helper: Get or Init User & Check Credit Reset
async function getOrInitUser(uid) {
  const selectQuery = 'SELECT * FROM users WHERE uid = $1';
  const insertQuery = 'INSERT INTO users (uid, credits, last_credit_reset) VALUES ($1, 50, NOW()) RETURNING *';
  const updateQuery = 'UPDATE users SET credits = 5, last_credit_reset = NOW() WHERE uid = $1 RETURNING *';

  try {
    const res = await pool.query(selectQuery, [uid]);
    if (res.rowCount === 0) {
      const newRes = await pool.query(insertQuery, [uid]);
      return newRes.rows[0];
    }

    const user = res.rows[0];
    const lastReset = new Date(user.last_credit_reset);
    const now = new Date();
    const diffDays = Math.floor((now - lastReset) / (1000 * 60 * 60 * 24));

    if (diffDays >= 30) {
      const updatedRes = await pool.query(updateQuery, [uid]);
      return updatedRes.rows[0];
    }

    return user;
  } catch (err) {
    console.error('❌ getOrInitUser error:', err);
    throw err;
  }
}

// User & Credits Endpoints
app.get('/user/:uid', async (req, res) => {
  try {
    const user = await getOrInitUser(req.params.uid);
    res.json(user);
  } catch (err) {
    console.error(`❌ GET /user/${req.params.uid} error:`, err);
    res.status(500).json({ error: 'Failed to sync user', details: err.message });
  }
});

app.post('/use-credit/:uid', async (req, res) => {
  const { uid } = req.params;
  try {
    const user = await getOrInitUser(uid);
    if (user.credits <= 0) {
      return res.status(403).json({ error: 'No credits remaining' });
    }
    const result = await pool.query(
      'UPDATE users SET credits = credits - 1 WHERE uid = $1 RETURNING credits',
      [uid]
    );
    res.json({ message: 'Credit used', remaining: result.rows[0].credits });
  } catch (err) {
    console.error(`❌ POST /use-credit/${uid} error:`, err);
    res.status(500).json({ error: 'Failed to use credit', details: err.message });
  }
});

// Vaults Endpoints
app.get('/vaults/:uid', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vaults WHERE uid = $1 ORDER BY created DESC', [req.params.uid]);
    res.json(result.rows);
  } catch (err) {
    console.error(`❌ GET /vaults/${req.params.uid} error:`, err);
    res.status(500).json({ error: 'Failed to fetch vaults', details: err.message });
  }
});

app.post('/vaults/:uid', async (req, res) => {
  const { name } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO vaults (uid, name) VALUES ($1, $2) RETURNING *',
      [req.params.uid, name]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(`❌ POST /vaults/${req.params.uid} error:`, err);
    res.status(500).json({ error: 'Failed to create vault', details: err.message });
  }
});

app.patch('/folders/:id', async (req, res) => {
  const { id } = req.params;
  const { name, parent_id, sort_order } = req.body;

  const fields = [];
  const values = [];
  let idx = 1;

  if (name !== undefined) { fields.push(`name = $${idx++}`); values.push(name); }
  if (parent_id !== undefined) { fields.push(`parent_id = $${idx++}`); values.push(parent_id); }
  if (sort_order !== undefined) { fields.push(`sort_order = $${idx++}`); values.push(sort_order); }

  fields.push(`updated = NOW()`);

  if (fields.length === 1) return res.status(400).json({ error: 'No fields to update' });

  const query = `UPDATE folders SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
  values.push(id);

  try {
    const result = await pool.query(query, values);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: `Folder ${id} not found` });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`❌ PATCH /folders/${id} error:`, err);
    res.status(500).json({ error: 'Failed to update folder', details: err.message });
  }
});

app.delete('/folders/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM folders WHERE id = $1', [req.params.id]);
    res.json({ message: 'Folder deleted' });
  } catch (err) {
    console.error(`❌ DELETE /folders/${req.params.id} error:`, err);
    res.status(500).json({ error: 'Failed to delete folder', details: err.message });
  }
});

app.delete('/vaults/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM vaults WHERE id = $1', [req.params.id]);
    res.json({ message: 'Vault deleted' });
  } catch (err) {
    console.error(`❌ DELETE /vaults/${req.params.id} error:`, err);
    res.status(500).json({ error: 'Failed to delete vault', details: err.message });
  }
});

// Folders Endpoints
app.get('/folders/:vault_id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM folders WHERE vault_id = $1 ORDER BY sort_order ASC, created DESC',
      [req.params.vault_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(`❌ GET /folders/${req.params.vault_id} error:`, err);
    res.status(500).json({ error: 'Failed to fetch folders', details: err.message });
  }
});

app.post('/folders', async (req, res) => {
  const { vault_id, parent_id, name, sort_order } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO folders (vault_id, parent_id, name, sort_order) VALUES ($1, $2, $3, $4) RETURNING *',
      [vault_id, parent_id || null, name, sort_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(`❌ POST /folders error:`, err);
    res.status(500).json({ error: 'Failed to create folder', details: err.message });
  }
});

// Notes Endpoints
app.get('/notes', async (req, res) => {
  const { uid, vault_id, folder_id } = req.query;
  let query = 'SELECT * FROM notes WHERE uid = $1';
  const params = [uid];

  if (vault_id) {
    query += ' AND vault_id = $2';
    params.push(vault_id);
  }
  if (folder_id) {
    query += ` AND folder_id = $${params.length + 1}`;
    params.push(folder_id);
  } else if (vault_id) {
    query += ' AND folder_id IS NULL'; // Root notes of a vault
  }

  query += ' ORDER BY sort_order ASC, created DESC';

  try {
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(`❌ GET /notes error:`, err);
    res.status(500).json({ error: 'Failed to fetch notes', details: err.message });
  }
});

app.get('/notes/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notes WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Note not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`❌ GET /notes/${req.params.id} error:`, err);
    res.status(500).json({ error: 'Failed to fetch note', details: err.message });
  }
});

app.post('/notes', async (req, res) => {
  const { uid, vault_id, folder_id, title, content, sort_order } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO notes (uid, vault_id, folder_id, title, content, sort_order, created, updated)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
       RETURNING *`,
      [uid, vault_id, folder_id || null, title, content, sort_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(`❌ POST /notes error:`, err);
    res.status(500).json({ error: 'Failed to create note', details: err.message });
  }
});

app.patch('/notes/:id/move', async (req, res) => {
  const { id } = req.params;
  const { folder_id } = req.body;
  try {
    const result = await pool.query(
      'UPDATE notes SET folder_id = $1, updated = NOW() WHERE id = $2 RETURNING *',
      [folder_id, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`❌ PATCH /notes/${id}/move error:`, err);
    res.status(500).json({ error: 'Failed to move note', details: err.message });
  }
});

app.patch('/folders/:id/move', async (req, res) => {
  const { id } = req.params;
  const { parent_id } = req.body;
  try {
    const result = await pool.query(
      'UPDATE folders SET parent_id = $1, updated = NOW() WHERE id = $2 RETURNING *',
      [parent_id, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`❌ PATCH /folders/${id}/move error:`, err);
    res.status(500).json({ error: 'Failed to move folder', details: err.message });
  }
});

app.post('/reorder', async (req, res, next) => {
  const { items } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'Expected items array' });

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');
    for (const item of items) {
      if (item.type === 'folder') {
        await client.query('UPDATE folders SET sort_order = $1, updated = NOW() WHERE id = $2', [item.sort_order, item.id]);
      } else if (item.type === 'note') {
        await client.query('UPDATE notes SET sort_order = $1, updated = NOW() WHERE id = $2', [item.sort_order, item.id]);
      }
    }
    await client.query('COMMIT');
    res.json({ message: 'Reordered successfully' });
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(e => console.error('Rollback failed:', e));
    console.error(`❌ POST /reorder error:`, err);
    res.status(500).json({ error: 'Failed to reorder items', details: err.message });
  } finally {
    if (client) client.release();
  }
});

app.patch('/notes/:id', async (req, res) => {
  const { id } = req.params;
  const { title, content, sort_order, folder_id } = req.body;

  const fields = [];
  const values = [];
  let idx = 1;

  if (title !== undefined) { fields.push(`title = $${idx++}`); values.push(title); }
  if (content !== undefined) { fields.push(`content = $${idx++}`); values.push(content); }
  if (sort_order !== undefined) { fields.push(`sort_order = $${idx++}`); values.push(sort_order); }
  if (folder_id !== undefined) { fields.push(`folder_id = $${idx++}`); values.push(folder_id); }

  fields.push(`updated = NOW()`);

  if (fields.length === 1) return res.status(400).json({ error: 'No fields to update' });

  const query = `UPDATE notes SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`;
  values.push(id);

  try {
    const result = await pool.query(query, values);
    console.log(`📝 PATCH /notes/${id} — rowCount: ${result.rowCount}, values sent:`, values.slice(0, -1).map(v => typeof v === 'object' ? '[JSONB]' : v));
    if (result.rowCount === 0) {
      return res.status(404).json({ error: `Note ${id} not found or nothing changed` });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(`❌ PATCH /notes/${id} error:`, err);
    res.status(500).json({ error: 'Failed to update note', details: err.message });
  }
});

app.delete('/notes/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM notes WHERE id = $1', [req.params.id]);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    console.error(`❌ DELETE /notes/${req.params.id} error:`, err);
    res.status(500).json({ error: 'Failed to delete note', details: err.message });
  }
});

// Transactions Endpoint
app.post('/transactions', async (req, res) => {
  const { uid, amount_credits, razorpay_order_id, razorpay_payment_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO credit_transactions (uid, amount_credits, razorpay_order_id, razorpay_payment_id, created_at)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [uid, amount_credits, razorpay_order_id, razorpay_payment_id]
    );

    // Also update user credits
    await pool.query(
      'UPDATE users SET credits = credits + $1 WHERE uid = $2',
      [amount_credits, uid]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(`❌ POST /transactions error:`, err);
    res.status(500).json({ error: 'Failed to log transaction', details: err.message });
  }
});

// --- Gemini Evaluation Layer ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/evaluate-session', async (req, res) => {
  const { originalText, recallText, mode } = req.body;

  if (!originalText || !recallText) {
    console.error('❌ POST /evaluate-session: Missing text inputs');
    return res.status(400).json({ error: 'Missing content for evaluation' });
  }

  try {
    // FORCE JSON output using generationConfig

    const model = genAI.getGenerativeModel({ 
      model: "gemini-1.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });


    const prompt = `
      You are an expert educational assistant evaluating a student's recall session.
      The student is using the ${mode === 'feynman' ? 'Feynman Technique (explaining as if to a child)' : 'Blurt Method (recalling as much as possible)'}.

      Original Note (Primary Source):
      ${originalText}

      Student's Recall/Explanation:
      ${recallText}

      Task:
      Evaluate the student's recall based on the original note.
      Provide a structured JSON response with the following keys:
      - "summary": A brief comparison summary (2-3 sentences).
      - "strengths": An array of specific strengths in their recall.
      - "weaknesses": An array of specific weaknesses or missing points.
      - "accuracy_score": A score from 0 to 10 (as a number).
      - "learning_effectiveness_score": A score from 0 to 10 (as a number).
      - "recommendation": A final actionable tip for the student.

      Ensure the output is ONLY a valid JSON object.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up potential markdown formatting (safety backup)
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
      const evaluation = JSON.parse(text);
      res.json(evaluation);
    } catch (parseError) {
      console.error('❌ Failed to parse Gemini output:', text);
      res.status(500).json({
        error: 'Invalid JSON from AI',
        details: parseError.message,
        raw: text
      });
    }
  } catch (err) {
    console.error('❌ Gemini Evaluation Error:', err);
    res.status(500).json({ error: 'Failed to evaluate session with AI', details: err.message });
  }
});

app.use((err, req, res, next) => {
  console.error(`❌ Unhandled route error [${req.method} ${req.path}]:`, err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

const server = app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Server failed to start: Port ${port} is already in use`);
  } else {
    console.error('❌ Server failed to start:', err);
  }
  process.exit(1);
});
