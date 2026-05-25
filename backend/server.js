console.log('🔥 Server script starting...');
const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const Razorpay = require('razorpay');

const razorpay = new Razorpay({
  key_id: (process.env.RAZORPAY_KEY_ID || '').trim(),
  key_secret: (process.env.RAZORPAY_KEY_SECRET || '').trim(),
});

// Runtime Env Validation
if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  console.error('❌ CRITICAL: Razorpay keys missing in .env!');
} else {
  console.log('💳 Razorpay Key ID:', `${process.env.RAZORPAY_KEY_ID.slice(0, 8)}... (Length: ${process.env.RAZORPAY_KEY_ID.length})`);
  console.log('💳 Razorpay Secret:', `**** (Length: ${process.env.RAZORPAY_KEY_SECRET.length})`);
}

// Order Tracking (Strict Lifecycle)
const activeOrders = new Map();

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

// ✅ REQUIRED: Handle idle client errors
pool.on('error', (err) => {
  console.error('❌ Unexpected PostgreSQL pool error:', err.message);
});

// --- Supabase Client Init (for Auth) ---
// Node.js < 22 requires "ws" for Supabase Realtime
const ws = require('ws');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: { persistSession: false },
    realtime: { transport: ws }
  }
);

// --- Auth Middleware ---
async function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Missing Authorization header' });

  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Invalid token format' });

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      console.warn(`🔓 Auth failed: ${error?.message || 'No user found'}`);
      return res.status(401).json({ error: 'Unauthorized', details: error?.message });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Auth error' });
  }
}

// --- Token & Credit Helpers ---
const calculateTokens = (text) => Math.ceil((text || '').length / 4);
const getEffectiveTokens = (tokens) => tokens * 1.1;

const calculateCost = (inputChars, outputChars) => {
  const inputTokens = getEffectiveTokens(calculateTokens(inputChars));
  const outputTokens = getEffectiveTokens(calculateTokens(outputChars));

  const inputCost = inputTokens / 2000;
  const outputCost = outputTokens / 100;

  return {
    inputCost,
    outputCost,
    totalCost: inputCost + outputCost,
    inputTokens,
    outputTokens
  };
};

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
app.get('/user/me', authenticateUser, async (req, res) => {
  try {
    const user = await getOrInitUser(req.user.id);
    res.json(user);
  } catch (err) {
    console.error(`❌ GET /user/me error:`, err);
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
app.get('/vaults/:uid', authenticateUser, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vaults WHERE uid = $1 ORDER BY created DESC', [req.params.uid]);
    res.json(result.rows);
  } catch (err) {
    console.error(`❌ GET /vaults/${req.params.uid} error:`, err);
    res.status(500).json({ error: 'Failed to fetch vaults', details: err.message });
  }
});

app.post('/vaults/:uid', authenticateUser, async (req, res) => {
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

app.patch('/folders/:id', authenticateUser, async (req, res) => {
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

app.delete('/folders/:id', authenticateUser, async (req, res) => {
  try {
    await pool.query('DELETE FROM folders WHERE id = $1', [req.params.id]);
    res.json({ message: 'Folder deleted' });
  } catch (err) {
    console.error(`❌ DELETE /folders/${req.params.id} error:`, err);
    res.status(500).json({ error: 'Failed to delete folder', details: err.message });
  }
});

app.delete('/vaults/:id', authenticateUser, async (req, res) => {
  try {
    await pool.query('DELETE FROM vaults WHERE id = $1', [req.params.id]);
    res.json({ message: 'Vault deleted' });
  } catch (err) {
    console.error(`❌ DELETE /vaults/${req.params.id} error:`, err);
    res.status(500).json({ error: 'Failed to delete vault', details: err.message });
  }
});

// Folders Endpoints
app.get('/folders/:vault_id', authenticateUser, async (req, res) => {
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

app.post('/folders', authenticateUser, async (req, res) => {
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
app.get('/notes', authenticateUser, async (req, res) => {
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

app.get('/notes/:id', authenticateUser, async (req, res) => {
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

app.post('/notes', authenticateUser, async (req, res) => {
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

app.patch('/notes/:id/move', authenticateUser, async (req, res) => {
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

app.patch('/folders/:id/move', authenticateUser, async (req, res) => {
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

app.post('/reorder', authenticateUser, async (req, res, next) => {
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

app.patch('/notes/:id', authenticateUser, async (req, res) => {
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

app.delete('/notes/:id', authenticateUser, async (req, res) => {
  try {
    await pool.query('DELETE FROM notes WHERE id = $1', [req.params.id]);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    console.error(`❌ DELETE /notes/${req.params.id} error:`, err);
    res.status(500).json({ error: 'Failed to delete note', details: err.message });
  }
});

// --- Razorpay Payment Integration ---
app.get('/credits/:uid', async (req, res) => {
  try {
    const user = await getOrInitUser(req.params.uid);
    res.json({ credits: user.credits });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch credits' }); }
});

app.post('/create-razorpay-order', async (req, res) => {
  try {
    const { amount, uid } = req.body;
    if (!amount || isNaN(amount) || !uid) {
      return res.status(400).json({ error: 'Valid amount and UID are required' });
    }

    // ENSURE PAISÉ (Integer Only)
    const amountPaise = Math.round(parseFloat(amount) * 100);
    console.log(`💳 [NEW ORDER] uid: ${uid}, amount: ₹${amount} (${amountPaise} paise)`);

    const options = {
      amount: amountPaise,
      currency: 'INR',
      receipt: `rcpt_${uid.slice(0, 8)}_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    // TRACK ORDER LOCALLY FOR VERIFICATION
    activeOrders.set(order.id, {
      uid,
      amountPaise,
      createdAt: Date.now()
    });

    // Cleanup old orders (older than 30 mins)
    for (const [id, data] of activeOrders.entries()) {
      if (Date.now() - data.createdAt > 30 * 60 * 1000) activeOrders.delete(id);
    }

    console.log(`✅ Razorpay order created for ${uid}:`, JSON.stringify(order, null, 2));
    console.log(`🔑 Using Key ID: ${process.env.RAZORPAY_KEY_ID}`);
    res.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.RAZORPAY_KEY_ID
    });
  } catch (err) {
    console.error('❌ Razorpay order creation failed:', err);
    res.status(500).json({
      error: 'Order creation failed',
      detail: err?.description || err?.message || 'Check Razorpay credentials'
    });
  }
});

app.post('/verify-payment', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, uid, creditsToAdd } = req.body;

  // STRICT FIELD CHECK
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !uid || !creditsToAdd) {
    console.warn('❌ Verification rejected: Missing required fields');
    return res.status(400).json({ error: 'Missing payment details' });
  }

  // LIFECYCLE CHECK: Does this order exist in our system?
  const trackedOrder = activeOrders.get(razorpay_order_id);
  if (!trackedOrder) {
    console.warn(`❌ Verification rejected: Order ${razorpay_order_id} not found/expired`);
    return res.status(400).json({ error: 'Order session expired or invalid' });
  }

  // TRANSACTION DATA VALIDATION
  const expectedPaise = Math.round(parseFloat(creditsToAdd) * 100);
  if (trackedOrder.uid !== uid || trackedOrder.amountPaise !== expectedPaise) {
    console.warn(`❌ Verification rejected: Data mismatch for order ${razorpay_order_id}`);
    return res.status(400).json({ error: 'Payment data mismatch' });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  const text = `${razorpay_order_id}|${razorpay_payment_id}`;
  const generated = crypto
    .createHmac("sha256", secret)
    .update(text, "utf-8")
    .digest("hex");

  console.log(`🔐 Verification for ${razorpay_order_id}: Generated[...${generated.slice(-10)}] vs Received[...${razorpay_signature.slice(-10)}]`);

  if (generated === razorpay_signature) {
    try {
      const credits = parseInt(creditsToAdd); // PURE INTEGER
      const result = await pool.query(
        `INSERT INTO users (uid, credits, last_credit_reset)
         VALUES ($1, $2, NOW())
         ON CONFLICT (uid)
         DO UPDATE SET credits = users.credits + EXCLUDED.credits
         RETURNING credits`,
        [uid.trim(), credits]
      );

      await pool.query(
        'INSERT INTO credit_transactions (uid, amount_credits, razorpay_order_id, razorpay_payment_id) VALUES ($1, $2, $3, $4)',
        [uid, credits, razorpay_order_id, razorpay_payment_id]
      );

      // Successfully processed: cleanup
      activeOrders.delete(razorpay_order_id);

      console.log(`✅ Payment verified for ${uid}. New balance: ${result.rows[0].credits}`);
      res.json({ success: true, newBalance: result.rows[0].credits });
    } catch (err) {
      console.error('❌ DB update failed:', err);
      res.status(500).json({ error: 'DB update failed' });
    }
  } else {
    console.warn(`❌ Invalid signature for order ${razorpay_order_id}`);
    res.status(400).json({ error: 'Invalid signature' });
  }
});

// --- Gemini Evaluation Layer ---
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/evaluate-session', authenticateUser, async (req, res) => {
  const { originalText, recallText, mode } = req.body;
  const uid = req.user.id;

  if (!originalText || !recallText) {
    return res.status(400).json({ error: 'Missing content for evaluation' });
  }

  // 1. Estimate Cost & Reserve Credits (Transaction 1)
  const systemPromptTemplate = `
      You are an expert educational assistant evaluating a student's recall session.
      The student is using the ${mode === 'feynman' ? 'Feynman Technique (explaining as if to a child)' : 'Blurt Method (recalling as much as possible)'}.

      Original Note (Primary Source):
      
      Student's Recall/Explanation:
      

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

  const fullInput = systemPromptTemplate + originalText + recallText;
  // Reservation cost: Input tokens + heuristic for max output (e.g. 1500 chars ~ 375 tokens)
  const reservationEstimate = calculateCost(fullInput, " ".repeat(1500)).totalCost;

  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN');

    // Row-level lock
    const userRes = await client.query('SELECT credits FROM users WHERE uid = $1 FOR UPDATE', [uid]);
    if (userRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'User profile not found' });
    }

    const currentCredits = parseFloat(userRes.rows[0].credits);
    if (currentCredits < reservationEstimate) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Insufficient credits', required: reservationEstimate.toFixed(2), have: currentCredits.toFixed(2) });
    }

    // Reservation Step
    await client.query('UPDATE users SET credits = credits - $1 WHERE uid = $2', [reservationEstimate, uid]);
    await client.query('COMMIT');
    client.release();
    client = null; // Mark as released

    // 2. Call Gemini API
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { responseMimeType: "application/json" }
    });

    const result = await model.generateContent(fullInput);
    const response = await result.response;
    let text = response.text();

    // 3. Post-calculate & Adjust (Transaction 2)
    const actualCostInfo = calculateCost(fullInput, text);
    const costError = reservationEstimate - actualCostInfo.totalCost;

    client = await pool.connect();
    await client.query('BEGIN');
    // Refund the difference (could be positive or negative, but costError is usually positive)
    await client.query('UPDATE users SET credits = credits + $1 WHERE uid = $2', [costError, uid]);
    await client.query('COMMIT');

    // Return Evaluation
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const evaluation = JSON.parse(text);
    res.json({ ...evaluation, creditsUsed: actualCostInfo.totalCost.toFixed(4) });

  } catch (err) {
    console.error('❌ AI Evaluation Error:', err);

    // 4. Rollback Reservation on Failure
    if (client) {
      try {
        await client.query('ROLLBACK');
      } catch (rbErr) { /* ignore */ }
    }

    // If it was already committed (reservation is independent), we must refund explicitly
    try {
      const refundClient = client || await pool.connect();
      await refundClient.query('UPDATE users SET credits = credits + $1 WHERE uid = $2', [reservationEstimate, uid]);
      if (!client) refundClient.release();
    } catch (refErr) {
      console.error('❌ Critical: Failed to refund credits after evaluation error!', refErr);
    }

    res.status(500).json({ error: 'Evaluation failed', details: err.message });
  } finally {
    if (client) client.release();
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
