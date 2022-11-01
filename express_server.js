// Require express for server
const express = require('express');
// Require request-promise for learning/experimenting
const reqProm = require('request-promise');
// Assign the server instance to a const
const app = express();

const PORT = 8080;

// URL Database - Stand in for a backend database
// Can now take
const urlDatabase = {
  "b2xVn2": "http://lighthouselabs.ca",
  "9sm5xK": "http://www.google.com",
};

// For learning/experimenting
let hipsumText;
const hipsumFetch = () => reqProm("http://hipsum.co/api/?type=hipster-centric&sentences=3");


// Main code

// Handling post request from urls/new
app.post('/urls', (req, res) => {
  console.log("Request body:\n", req.body);
  console.log("longURL: ", req.body.longURL);
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client post request for /url/new");
})

// View engine that will render ejs as html
app.set('view engine', 'ejs');

// Middle ware to take in form POST and encode as url
app.use(express.urlencoded({ extended: true}));

// Route for get for root
app.get('/', (req, res) => {
  res.send("Hello World!");
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client request for root");
});

// Route for get to url list page
app.get('/urls.json', (req, res) => {
  res.send(urlDatabase);
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client request for /urls.json");
});

// Route for url page with table of urls IDs and long urls
app.get('/urls', (req, res) => {
  const templateVars = {urls: urlDatabase};
  res.render('urls_index', templateVars);
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client request for /urls");
});

// Route to page with form to post new urls
app.get('/urls/new', (req, res) => {
  res.render('urls_new');
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client request for /urls/new");
});

// Route to page for given id's url
app.get('/urls/:id', (req, res) => {
  console.log(req);
  const templateVars = { id: req.params.id, longURL: urlDatabase[this.id]};
  res.render('urls_show', (templateVars));
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client request for /urls/id");
});

// Learning/experimenting route
app.get('/helloWorld', (req, res) => {
  res.send("<html><body><h1>Hello World!</h1></body></html>");
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client request for /helloWorld");
});

// Learning/experimenting route
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
  
});

app.listen(PORT, () => {
  console.log(`Express server up: listening on port ${PORT}`);
});