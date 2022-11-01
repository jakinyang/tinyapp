const express = require('express');
const reqProm = require('request-promise');
const app = express();
const PORT = 8080;

const urlDatabase = {
  "b2xVn2": "http://lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

let hipsumText;
const hipsumFetch = () => reqProm("http://hipsum.co/api/?type=hipster-centric&sentences=3");

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
app.get('/urls', (req, res) => {
  const templateVars = {urls: urlDatabase};
  res.render('urls_index', templateVars);
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client request for /urls");
})
app.get('/helloWorld', (req, res) => {
  res.send("<html><body><h1>Hello World!</h1></body></html>");
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client request for /helloWorld");
})
app.get('/hipsum', (req, res) => {
  hipsumFetch()
  .then(data => {
    console.log("Data fetch for hipsum successful: data");
    hipsumText = JSON.parse(data);
    res.render('hipsum', { hipsumText: hipsumText });
    console.log("Request Method: ", req.method);
    console.log("Request URL: ", req.url);
    console.log("Client request for /hipsum");
  })
  .catch(error => {
    console.log(error);
    res.redirect('pages/404');
  });
  
})

app.listen(PORT, () => {
  console.log(`Express server up: listening on port ${PORT}`);
})