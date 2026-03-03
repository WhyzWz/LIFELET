// controllers/readingsController.js
const pool = require('../database');

// Tabela batimentosdia (assumi nome 'batimentosdia' com colunas Batimentos, DataHora, UserID, IDBpmDia)
exports.listReadings = async (req, res) => {
  try {
    const userId = req.query.userId || req.user && req.user.id;
    if (!userId) return res.status(400).json({ message: 'userId é obrigatório' });

    // pegar últimas 100 leituras
    const [rows] = await pool.query(
      `SELECT IDBpmDia AS id, Batimentos AS bpm, DataHora AS timestamp, UserID AS userId
       FROM batimentosdia
       WHERE UserID = ?
       ORDER BY DataHora DESC
       LIMIT 200`,
      [userId]
    );

    // normalizar timestamp para ISO
    const data = rows.map(r => ({
      id: r.id,
      bpm: r.bpm,
      timestamp: r.timestamp ? new Date(r.timestamp).toISOString() : null,
      userId: r.userId
    }));

    return res.json(data);
  } catch (err) {
    console.error('listReadings error', err);
    return res.status(500).json({ message: 'Erro ao buscar leituras' });
  }
};

exports.createReading = async (req, res) => {
  try {
    const { userId, bpm, timestamp } = req.body;
    if (!userId || typeof bpm === 'undefined') {
      return res.status(400).json({ message: 'userId e bpm são obrigatórios' });
    }

    const date = timestamp ? new Date(timestamp) : new Date();

    const [result] = await pool.query(
      `INSERT INTO batimentosdia (Batimentos, DataHora, UserID) VALUES (?, ?, ?)`,
      [bpm, date, userId]
    );

    return res.status(201).json({ id: result.insertId, userId, bpm, timestamp: date.toISOString() });
  } catch (err) {
    console.error('createReading error', err);
    return res.status(500).json({ message: 'Erro ao gravar leitura' });
  }
};
