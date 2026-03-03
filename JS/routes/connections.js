// routes/connections.js
const express = require('express');
const router = express.Router();
const connectionsController = require('../controllers/connectionsController');
const authMiddleware = require('../middleware/authMiddleware');

// criar vinculo (responsável -> usuário)
router.post('/', authMiddleware, connectionsController.createConnection);

// listar conexões de um usuário (ou do responsável)
router.get('/user/:id', authMiddleware, connectionsController.listConnections);

module.exports = router;
