// routes/readings.js
const express = require('express');
const router = express.Router();
const readingsController = require('../controllers/readingsController');
const authMiddleware = require('../middleware/authMiddleware');

// GET /readings?userId=123 - obter leituras (padrão últimas 50)
router.get('/', authMiddleware, readingsController.listReadings);

// POST /readings - gravar leitura
router.post('/', authMiddleware, readingsController.createReading);

module.exports = router;
