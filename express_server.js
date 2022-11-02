// Require express for server
const express = require('express');
// Requiring randomStringGen
const { randomStringGen } = require('./randomGenerator');
// Require morgan
const morgan = require('morgan');
// Requiring cookieParser
const cookieParser = require('cookie-parser');
// Assign the server instance to a const
const app = express();

const PORT = 8080;

// 
// Mock Databases
// 

// URL Database - Stand in for a backend database
const urlDatabase = {
  "generic": {
    "b2xVn2": "http://lighthouselabs.ca",
    "9sm5xK": "http://www.google.com",
  },
};

// User database
const userDatabase = {
  
};

// 
// Set up & middleware
// 

// View engine that will render ejs as html
app.set('view engine', 'ejs');

// Middleware to take in form POST and encode as url
app.use(express.urlencoded({ extended: true}));

// Morgan
app.use(morgan('dev'));

// Middleware to handle cookies
app.use(cookieParser());

// 
// Main code and request handlers
// 

// Handling post request from urls/new
app.post('/urls', (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
  };
  let newkey = randomStringGen();
  urlDatabase[newkey] = req.body.longURL;
  console.log("New longURL added: ", req.body.longURL);
  console.log("New shortURL id: ", newkey);
  console.log('URL Database', urlDatabase);
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client post request from /url/new");
  console.log('<<--------------------->>');
  res.redirect(`/urls/${newkey}`);
});

// Handling post delete request from urls/:id/delete
app.post('/urls/:id/delete', (req, res) => {
  const templateVars = { 
    id: req.params.id, 
    longURL: urlDatabase[req.params.id], 
    username: req.cookies["username"], 
  };
  console.log('Current urlDatabase: ', urlDatabase);
  console.log("Deleting: ", templateVars.id, templateVars.longURL);
  delete urlDatabase[templateVars.id];
  console.log('Updated urlDatabase: ', urlDatabase);
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log(`Client request for post delete /urls/${templateVars.id}/delete`);
  console.log('<<--------------------->>');
  res.redirect('/urls');
});

// Handling post update request from urls/:id/
app.post('/urls/:id', (req, res) => {
  const templateVars = { 
    loginToken: req.headers.cookies.userID,
    id: req.params.id, 
    longURL: req.body.longURL, 
    username: req.cookies["username"], 
  };
  console.log('Current urlDatabase: ', urlDatabase);
  console.log("id: ", req.params.id);
  console.log("longURL: ", req.body.longURL);
  // Conditional: if browser has login cookie && cookie marker matches a 

  // If not
  urlDatabase.generic[req.params.id] = req.body.longURL;
  console.log('Updated urlDatabase: ', urlDatabase);
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log(`Client request for post update /urls/${templateVars.id} to ${req.body.longURL}`);
  console.log('<<--------------------->>');
  res.redirect(`/urls/${req.params.id}`);
});

// Handling post request for /login
app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const email = req.body.email;
  let cookieObj;

  if (!req.cookies.loginTokenID || !req.cookies.loginTokenPass) {
    for (let id in userDatabase) {
      if(id.email !== email || id.password !== password) {
        res.cookie('badLogin', true);
        res.redirect('/login')
      }
    }
    // Test console logs
    return res.redirect('/urls');
  }
  res.redirect('/urls')

  res.cookie('username', username);
  res.redirect('/urls');
  console.log("cookies:", req.cookies);
  console.log("username: ", username);
  console.log("request body: ", req.body);
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log('<<--------------------->>');
});

// Handling post request for /logout
app.post('/logout', (req, res) => {
  res.clearCookie('username');
  res.redirect('/urls');
  console.log("cookies:", req.cookies);
  console.log("username: ", req.body.username);
  console.log("request body: ", req.body);
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log('<<--------------------->>');
});

// Handling post request for /regsiter
// POST request 
app.post('/register', (req, res) => {
  const userId = randomStringGen();
  const password = req.body.password;
  const email = req.body.email;
  // If the person is not already logged in
  // -->> Does note have loginToken cookie
  console.log("Current userDatabase: ", userDatabase);
  if (!req.cookies.loginTokenID || !req.cookies.loginTokenPass) {
    userDatabase[userId] = {
      email,
      password,
    };
    // Test console logs
    console.log("request body: ", req.body);
    console.log("email: ", req.body.email);
    console.log("password: ", req.body.password);
    console.log("Updated userDatabase: ", userDatabase);
    console.log("Request Method: ", req.method);
    console.log("Request URL: ", req.url);
    console.log('<<--------------------->>');
    return res.redirect('/login');
  }
  res.redirect('/urls')
  // Test console logs
  console.log("request body: ", req.body);
  console.log("email: ", req.body.email);
  console.log("password: ", req.body.password);
  console.log("Updated userDatabase: ", userDatabase);
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log('<<--------------------->>');
});

// Route for get for root
app.get('/', (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
  };
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client request for root, redirect to /urls");
  console.log('<<--------------------->>');
  res.redirect("/urls");
});

// Route for get to urls json page
app.get('/urls.json', (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
  };
  res.send(urlDatabase);
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client request for /urls.json");
  console.log('<<--------------------->>');
});

// Route for url page with table of urls IDs and long urls
app.get('/urls', (req, res) => {
  const templateVars = {
    urls: urlDatabase.generic, 
    username: req.cookies["username"],
  };
  res.render('urls_index', templateVars);
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client request for /urls");
  console.log('<<--------------------->>');
});

// Route to page with form to post new urls
app.get('/urls/new', (req, res) => {
  const templateVars = {
    username: req.cookies["username"],
  };
  res.render('urls_new', templateVars);
  // Test Logs
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client request for /urls/new");
  console.log('<<--------------------->>');
});

// Route to /register page
app.get('/register', (req, res) => {
  const templateVars = {

  };
  res.render('urls_register', templateVars);
  // Test Logs
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client request for /register");
  console.log('<<--------------------->>');
});

// Route to /login page
app.get('/login', (req, res) => {
  const templateVars = {

  };
  res.render('urls_login', templateVars);
  // Test Logs
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client request for /login");
  console.log('<<--------------------->>');
});

// Route to page for given id's url
app.get('/urls/:id', (req, res) => {
  const templateVars = { 
    id: req.params.id, 
    longURL: urlDatabase[req.params.id], 
    username: req.cookies["username"], 
  };
  res.render('urls_show', templateVars);
  // Test Logs
  console.log("longURL: ", templateVars.longURL);
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log(`Client request for /urls/${templateVars.id}`);
  console.log('<<--------------------->>');
});

// Route for short url redirect
app.get('/u/:id', (req, res) => {
  const templateVars = { 
    id: req.params.id, 
    longURL: urlDatabase[req.params.id], 
    username: req.cookies["username"], 
  };
  res.redirect(templateVars.longURL);
  // Test Logs
  console.log("longURL: ", templateVars.longURL);
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client request for /urls/id");
  console.log('<<--------------------->>');
});

// Setting up listener
app.listen(PORT, () => {
  console.log(`Express server up: listening on port ${PORT}`);
});