// controllers/authController.js
const pool = require('../database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

// Nome da tabela: usuario
// Colunas esperadas: UserID, NomeCompleto, Email, Telefone, Senha, UserName, Funcao

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

exports.register = async (req, res) => {
  try {
    const { name, email, password, type, phone, username } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'name, email e password são obrigatórios' });
    }

    // Verificar duplicidade por Email ou UserName
    const [existing] = await pool.query(
      'SELECT UserID FROM usuario WHERE Email = ? OR UserName = ? LIMIT 1',
      [email, username || '']
    );
    if (existing.length > 0) {
      return res.status(409).json({ message: 'Email ou username já cadastrado' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    const funcao = type === 'guardian' ? 1 : 0; // mapping: Funcao TINYINT

    const [result] = await pool.query(
      `INSERT INTO usuario (NomeCompleto, Email, Telefone, Senha, UserName, Funcao)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [name, email, phone || '', hashed, username || '', funcao]
    );

    const userId = result.insertId;

    const user = {
      id: userId,
      name,
      email,
      type: type || 'user'
    };

    const token = generateToken({ id: userId, email, type: user.type });

    return res.status(201).json({ user, token });
  } catch (err) {
    console.error('register error', err);
    return res.status(500).json({ message: 'Erro no registro' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return res.status(400).json({ message: 'Email/username e senha são obrigatórios' });

    // Aceitar login por email ou username
    const [rows] = await pool.query(
      'SELECT UserID, NomeCompleto, Email, Senha, UserName, Funcao FROM usuario WHERE Email = ? OR UserName = ? LIMIT 1',
      [email, email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const userRow = rows[0];

    // comparar senha
    const match = await bcrypt.compare(password, userRow.Senha);
    if (!match) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const user = {
      id: userRow.UserID,
      name: userRow.NomeCompleto,
      email: userRow.Email,
      username: userRow.UserName,
      type: userRow.Funcao === 1 ? 'guardian' : 'user'
    };

    const token = generateToken({ id: user.id, email: user.email, type: user.type });

    // salvar token não é necessário no DB, apenas retornar
    return res.json({ user, token });
  } catch (err) {
    console.error('login error', err);
    return res.status(500).json({ message: 'Erro no login' });
  }
};
