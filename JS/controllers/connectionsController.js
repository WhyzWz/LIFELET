// controllers/connectionsController.js
const pool = require('../database');

// tabela conexao: id, id_usuario, id_responsavel
exports.createConnection = async (req, res) => {
  try {
    const { userId, guardianId } = req.body;

    if (!userId || !guardianId) return res.status(400).json({ message: 'userId e guardianId são obrigatórios' });

    // verificar existência similar
    const [existing] = await pool.query(
      'SELECT id FROM conexao WHERE id_usuario = ? AND id_responsavel = ? LIMIT 1',
      [userId, guardianId]
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Vínculo já existe' });
    }

    const [result] = await pool.query(
      'INSERT INTO conexao (id_usuario, id_responsavel) VALUES (?, ?)',
      [userId, guardianId]
    );

    return res.status(201).json({ id: result.insertId, userId, guardianId });
  } catch (err) {
    console.error('createConnection error', err);
    return res.status(500).json({ message: 'Erro ao criar conexão' });
  }
};

exports.listConnections = async (req, res) => {
  try {
    const id = req.params.id;

    // devolver usuários vinculados ao id (tanto se id for responsavel ou usuario)
    const [rows] = await pool.query(
      `SELECT c.id, c.id_usuario AS userId, c.id_responsavel AS guardianId,
              u.UserID AS UserID, u.NomeCompleto AS name, u.Email AS email
       FROM conexao c
       LEFT JOIN usuario u ON u.UserID = c.id_usuario
       WHERE c.id_usuario = ? OR c.id_responsavel = ?`,
      [id, id]
    );

    return res.json(rows);
  } catch (err) {
    console.error('listConnections error', err);
    return res.status(500).json({ message: 'Erro ao listar conexões' });
  }
};
