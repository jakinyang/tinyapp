const express = require('express');
const app = express();
const PORT = 8080;

const urlDatabase = {
  "b2xVn2": "http://lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
  res.send("Hello World!");
})
app.get('/urls.json', (req, res) => {
  res.json(urlDatabase);
})
app.get('/helloWorld', (req, res) => {
  res.send("<html><body><h1>Hello World!</h1></body></html>");
})
app.get('/hipsum', (req, res) => {
  res.render('hipsum');
})

app.listen(PORT, () => {
  console.log(`Express server up: listening on port ${PORT}`);
})