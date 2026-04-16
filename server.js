const express = require('express');
const path = require('path');

const app = express();

// static cho public
app.use(express.static(path.join(__dirname, 'public')));

// static cho root để load main.js
app.use(express.static(__dirname));

// route trang chủ
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(3000, () => {
  console.log('http://localhost:3000');
});