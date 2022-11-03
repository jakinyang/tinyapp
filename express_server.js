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
  generic: {
    'b2xVn2': "http://lighthouselabs.ca",
    '9sm5xK': "http://www.google.com",
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

// 
// POST REQUESTS
// 

// Handling post request from urls/new
app.post('/urls', (req, res) => {
  // loginToken cookie values
  const loginTokenID = req.cookies.loginTokenID;
  const loginTokenPass = req.cookies.loginTokenPass;
  // New random short urlID
  const newkey = randomStringGen();

  // Checking for login tokens
  if (!loginTokenID || !loginTokenPass) {
    urlDatabase['generic'][newkey] = req.body.longURL;
    return res.redirect(`/urls/${newkey}`);
  }
  // If logged in
  if (!urlDatabase[loginTokenID]) {
    // If first time making new tinyURL, initialize object for ID
    urlDatabase[loginTokenID] = {};
  };
  // Post long url and ID in object at loginTokenID
  urlDatabase[loginTokenID][newkey] = req.body.longURL;
  console.log("New longURL added: ", req.body.longURL);
  console.log("New shortURL id: ", newkey);
  console.log('URL Database', urlDatabase);
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client post request from /url/new");
  console.log('<<--------------------->>');
  return res.redirect(`/urls/${newkey}`);
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
  // loginToken cookie values
  const loginTokenID = req.cookies.loginTokenID;
  const loginTokenEmail = req.cookies.loginTokenEmail;
  const loginTokenPass = req.cookies.loginTokenPass;

  // Template vars contains urlDatabase subsets:
  // Generic and object matched with loginTokenID 
  const templateVars = {
    generic: urlDatabase['generic'],
    iDMatch: urlDatabase[loginTokenID],
    userEmail: loginTokenEmail,
    id: req.params.id, 
    longURL: null, 
  };
  
  if (!loginTokenID || !loginTokenPass) {
    templateVars.longURL = urlDatabase['generic'][req.params.id];
    urlDatabase['generic'][req.params.id] = req.body.longURL;
  }
  templateVars.longURL = urlDatabase[loginTokenID][req.params.id];
  urlDatabase[loginTokenID][req.params.id] = req.body.longURL;
  
  console.log('Current urlDatabase: ', urlDatabase);
  console.log("id: ", req.params.id);
  console.log("longURL: ", req.body.longURL);
  // Conditional: if browser has login cookie && cookie marker matches a 

  // If not
  console.log('Updated urlDatabase: ', urlDatabase);
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log(`Client request for post update /urls/${templateVars.id} to ${req.body.longURL}`);
  console.log('<<--------------------->>');
  res.redirect(`/urls/${req.params.id}`);
});

// Handling post request for /login
app.post('/login', (req, res) => {
  const password = req.body.password;
  const email = req.body.email;
  console.log("Cookies", req.cookies.badLogin);
  // If they are not logged in
  // They don't have one of the loginTokens or they don't have both loginTokens
  if (!req.cookies.loginTokenID || !req.cookies.loginTokenPass) {
    console.log("No loginTokens detected");
    console.log("Cycling through userDatabase");
    console.log("Current user input email", email);
    console.log("Current user input password", password);
    for (let id in userDatabase) {
      console.log("Current database email", userDatabase[id]['email']);
      console.log("Current database password", userDatabase[id]['password']);
      console.log("Current user input email", email);
      console.log("Current database password", password);
      if (userDatabase[id]['email'] === email && userDatabase[id]['password'] === password) {
        res.cookie('loginTokenID', id);
        res.cookie('loginTokenEmail', email);
        res.cookie('loginTokenPass', userDatabase[id]['password']);
        if (req.cookies.badLogin) {
          console.log("Clearing badLogin token");
          res.clearCookie('badLogin');
        }
        console.log("Redirecting to /urls");
        return res.redirect('/urls');
      }
    }
    console.log("No user input matches in userDatabase");
    if (!req.cookies.badLogin) {
      console.log("Applying badLoginToken");
      res.cookie('badLogin', true);
    }
    console.log("Redirecting to /login");
    console.log('<<--------------------->>');
    return res.redirect('/login');
  }
  // If they are logged in
  // They have both loginTokens
  console.log('Login tokens detected');
  console.log('Redirecting to /urls');
  console.log("request body: ", req.body);
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log('<<--------------------->>');
  return res.redirect('/urls')
});

// Handling post request for /logout
app.post('/logout', (req, res) => {
  res.clearCookie('loginTokenID');
  res.clearCookie('loginTokenEmail');
  res.clearCookie('loginTokenPass');
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

// 
// GET HANDLERS
// 

// Route for get for root
app.get('/', (req, res) => {
  // Root redirects to /url regardless of tokens
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client request for root, redirect to /urls");
  console.log('<<--------------------->>');
  return res.redirect("/urls");
});

// Route for get to urls json page
app.get('/urls.json', (req, res) => {
  // loginToken cookie values
  const loginTokenID = req.cookies.loginTokenID;
  const loginTokenPass = req.cookies.loginTokenPass;
  // Template vars contains urlDatabase subsets:
  // Generic and object matched with loginTokenID 
  const templateVars = {
    generic: JSON.stringify(urlDatabase['generic']),
    iDMatch: JSON.stringify(urlDatabase[loginTokenID]),
  };
  if (!loginTokenID || !loginTokenPass) {
    console.log("No loginToken detected");
    console.log("Displaying urlDatabase generic");
    console.log("Request Method: ", req.method);
    console.log("Request URL: ", req.url);
    console.log("Client request for /urls.json");
    console.log('<<--------------------->>');
    return res.send(templateVars.generic);
  }
  
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client request for /urls.json");
  console.log('<<--------------------->>');
  return res.send(templateVars.iDMatch);
});

// Route for url page with table of urls IDs and long urls
app.get('/urls', (req, res) => {
  // loginToken cookie values
  const loginTokenID = req.cookies.loginTokenID;
  const loginTokenEmail = req.cookies.loginTokenEmail;
  const loginTokenPass = req.cookies.loginTokenPass;

  // Template vars contains urlDatabase subsets:
  // Generic and object matched with loginTokenID 
  const templateVars = {
    showLogin: false,
    urls: urlDatabase['generic'],
    userEmail: loginTokenEmail,
  };

  if (!loginTokenID || !loginTokenPass || !loginTokenEmail) {
    templateVars.showLogin = true;
    return res.render('urls_index', templateVars);
  }

  if (loginTokenEmail === userDatabase[loginTokenID]['email'] && loginTokenPass === userDatabase[loginTokenID]['password']) {
    templateVars.urls = urlDatabase[loginTokenID];
  }

  res.render('urls_index', templateVars);
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client request for /urls");
  console.log('<<--------------------->>');
});

// Route to page with form to post new urls
app.get('/urls/new', (req, res) => {
  // loginToken cookie values
  const loginTokenID = req.cookies.loginTokenID;
  const loginTokenEmail = req.cookies.loginTokenEmail;
  const loginTokenPass = req.cookies.loginTokenPass;

  const templateVars = {
    showLogin: false,
    userEmail: loginTokenEmail,
  };
  if (!loginTokenID || !loginTokenPass) {
    templateVars.showLogin = true;
  }
  res.render('urls_new', templateVars);
  // Test Logs
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client request for /urls/new");
  console.log('<<--------------------->>');
});

// Route to /register page
app.get('/register', (req, res) => {
  // loginToken cookie values
  const loginTokenID = req.cookies.loginTokenID;
  const loginTokenEmail = req.cookies.loginTokenEmail;
  const loginTokenPass = req.cookies.loginTokenPass;

  // Template vars contains urlDatabase subsets:
  // Generic and object matched with loginTokenID 
  const templateVars = {
    showLogin: true,
    urls: urlDatabase[loginTokenID],
    userEmail: loginTokenEmail,
  };
  if (!loginTokenID || !loginTokenPass) {
    templateVars.userEmail = null;
    return res.render('urls_register', templateVars);
  }
  res.redirect('/urls')
  // Test Logs
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client request for /register");
  console.log('<<--------------------->>');
});

// Route to /login page
app.get('/login', (req, res) => {
  // loginToken cookie values
  const loginTokenID = req.cookies.loginTokenID;
  const loginTokenEmail = req.cookies.loginTokenEmail;
  const loginTokenPass = req.cookies.loginTokenPass;

  // Template vars contains urlDatabase subsets:
  // Generic and object matched with loginTokenID 
  const templateVars = {
    showLogin: false,
    userEmail: loginTokenEmail,
    badLogin: req.cookies.badLogin ? req.cookies.badLogin : null,
  };
  if (!loginTokenID || !loginTokenPass) {
    templateVars.userEmail = null;
    return res.render('urls_login', templateVars);
  }
  res.redirect('/urls');
  // Test Logs
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client request for /login");
  console.log('<<--------------------->>');
});

// Route to page for given id's url
app.get('/urls/:id', (req, res) => {

  // loginToken cookie values
  const loginTokenID = req.cookies.loginTokenID;
  const loginTokenEmail = req.cookies.loginTokenEmail;
  const loginTokenPass = req.cookies.loginTokenPass;

  // Template vars contains urlDatabase subsets:
  // Generic and object matched with loginTokenID 
  const templateVars = {
    showLogin: false,
    userEmail: loginTokenEmail,
    id: req.params.id, 
    longURL: null, 
  };
  
  if (!loginTokenID || !loginTokenPass) {
    templateVars.showLogin = true;
    templateVars.longURL = urlDatabase['generic'][req.params.id];
  }
  if (loginTokenEmail === userDatabase[loginTokenID]['email'] && loginTokenPass === userDatabase[loginTokenID]['password']) {
    templateVars.longURL = urlDatabase[loginTokenID][req.params.id];
  }
  // Test Logs
  console.log("longURL: ", templateVars.longURL);
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log(`Client request for /urls/${templateVars.id}`);
  console.log('<<--------------------->>');
  return res.render('urls_show', templateVars);
});

// Route for short url redirect
app.get('/u/:id', (req, res) => {
  const databaseIterator = (database, targetId) => {
    console.log('Looping through', database);
    for (let subDatabase in database) {
      console.log('Looping through', subDatabase);
      for (let id in database[subDatabase]) {
        console.log('Current id: ', database[subDatabase][id]);
        if (id === targetId) {
          console.log('Returning value: ', database[subDatabase][id]);
          return database[subDatabase][id];
        }
      }
    }
  }
  let targetURL = databaseIterator(urlDatabase, req.params.id);
  
  res.redirect(targetURL);
  // Test Logs
  console.log("longURL: ", targetURL);
  console.log("Request Method: ", req.method);
  console.log("Request URL: ", req.url);
  console.log("Client request for /urls/id");
  console.log('<<--------------------->>');
});

// Setting up listener
app.listen(PORT, () => {
  console.log(`Express server up: listening on port ${PORT}`);
});