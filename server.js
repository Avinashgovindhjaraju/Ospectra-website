const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Allow CORS for local dev (optional, remove in prod)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

const USERS_FILE = path.join(__dirname, 'users.json');

function readUsers() {
    if (!fs.existsSync(USERS_FILE)) return [];
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function writeUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    const users = readUsers();
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        res.json({ success: true, message: 'Login successful', age: user.age });
    } else {
        res.json({ success: false, message: 'User not found or wrong password' });
    }
});

app.post('/api/signup', (req, res) => {
    const { username, password, age } = req.body;
    let users = readUsers();
    if (users.find(u => u.username === username)) {
        return res.json({ success: false, message: 'User already exists' });
    }
    users.push({ username, password, age });
    writeUsers(users);
    res.json({ success: true, message: 'Sign up successful' });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
