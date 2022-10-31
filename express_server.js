const express = require('express');
const app = express();
const PORT = 8080;

const urlDatabase = {
  "b2xVn2": "http://lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

app.get('/', (req, res) => {
  req.send("Hello World!");
})
app.get('/', (req, res) => {
  req.send("Hello World!");
})
app.get('/', (req, res) => {
  req.send("Hello World!");
})

app.listen(PORT, () => {
  console.log(`Express server up: listening on port ${PORT}`);
})