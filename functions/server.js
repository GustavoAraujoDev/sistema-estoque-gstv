const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Servir arquivos estáticos do diretório 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Servir a página de login
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Servir a página do dashboard
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`O servidor está rodando em http://localhost:${port}`);
});
