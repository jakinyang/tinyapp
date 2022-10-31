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
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client request for root");
})
app.get('/urls.json', (req, res) => {
  res.send(urlDatabase);
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client request for /urls.json");
})
app.get('/helloWorld', (req, res) => {
  res.send("<html><body><h1>Hello World!</h1></body></html>");
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client request for /helloWorld");
})
app.get('/hipsum', (req, res) => {
  res.render('hipsum');
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client request for /hipsum");
})

app.listen(PORT, () => {
  console.log(`Express server up: listening on port ${PORT}`);
})