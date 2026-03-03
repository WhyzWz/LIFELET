// server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
dotenv.config();

const authRoutes = require('./routes/auth');
const readingsRoutes = require('./routes/readings');
const connectionsRoutes = require('./routes/connections');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS config - permitir seu frontend (pode restringir origin em produção)
app.use(cors({
  origin: '*',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.options('*', cors());

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/auth', authRoutes);
app.use('/readings', readingsRoutes);
app.use('/connections', connectionsRoutes);

// Health
app.get('/', (req, res) => res.json({ ok: true, message: 'Lifelet API' }));

app.listen(PORT, () => {
  console.log(`Lifelet API rodando na porta ${PORT}`);
});
