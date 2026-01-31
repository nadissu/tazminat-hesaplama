const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Main route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Legal pages
app.get('/gizlilik', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'gizlilik.html'));
});

app.get('/kullanim-sartlari', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'kullanim-sartlari.html'));
});

app.get('/cerez-politikasi', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'cerez-politikasi.html'));
});

// Info pages
app.get('/hakkimizda', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'hakkimizda.html'));
});

app.get('/iletisim', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'iletisim.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
