// Require express for server
const express = require('express');
// Requiring randomStringGen
const { randomStringGen } = require('./randomGenerator');
// Requiring helperModules
const { databaseIterator, tokenAuthenticator, tripleTokenCheck } = require('./helperModules');
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

// Morgan for terminal logging
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
  return res.redirect(`/urls/${newkey}`);
});

// Handling post delete request from urls/:id/delete
app.post('/urls/:id/delete', (req, res) => {
  // loginToken cookie values
  const cookies = req.cookies;
  const id = req.params.id;
  if (tripleTokenCheck(cookies)) {
    if (urlDatabase[cookies.loginTokenID][id]) {
      delete urlDatabase[cookies.loginTokenID][id];
      return res.redirect('/urls');
    }
  }
  if(urlDatabase['generic'][id]) {
    delete urlDatabase['generic'][id]
  }
  res.redirect('/urls');
});

// Handling post update request from urls/:id/
app.post('/urls/:id', (req, res) => {
  // loginToken cookie values
  const cookies = req.cookies;
  const id = req.params.id;
  const longURL = req.body.longURL;
  // Template vars contains urlDatabase subsets:
  // Generic and object matched with loginTokenID 
  const templateVars = {
    cookies: cookies,
    id: id,
    longURL: null, 
  };
  
  if (!tripleTokenCheck(cookies)) {
    templateVars.longURL = urlDatabase['generic'][id];
    urlDatabase['generic'][id] = longURL;
    return res.redirect(`/urls/${req.params.id}`);
  }

  templateVars.longURL = urlDatabase[cookies.loginTokenID][id];
  urlDatabase[cookies.loginTokenID][id] = longURL;
  return res.redirect(`/urls/${req.params.id}`);
});

// Handling post request for /login
app.post('/login', (req, res) => {
  const password = req.body.password;
  const email = req.body.email;
  const cookies = req.cookies;
  // If they are not logged in
  // They don't have one of the loginTokens or they don't have both loginTokens
  if (!tripleTokenCheck(cookies)) {
    for (let id in userDatabase) {
      if (userDatabase[id]['email'] === email && userDatabase[id]['password'] === password) {
        res.cookie('loginTokenID', id);
        res.cookie('loginTokenEmail', email);
        res.cookie('loginTokenPass', userDatabase[id]['password']);
        if (req.cookies.badLogin) {
          res.clearCookie('badLogin');
        }
        return res.redirect('/urls');
      }
    }
    if (!cookies.badLogin) {
      res.cookie('badLogin', true);
    }
    return res.redirect('/login');
  }
  // If they are logged in
  // They have both loginTokens
  return res.redirect('/urls')
});

// Handling post request for /logout
app.post('/logout', (req, res) => {
  res.clearCookie('loginTokenID');
  res.clearCookie('loginTokenEmail');
  res.clearCookie('loginTokenPass');
  res.redirect('/urls');
});

// Handling post request for /regsiter
// POST request 
app.post('/register', (req, res) => {
  const userId = randomStringGen();
  const password = req.body.password;
  const email = req.body.email;
  const cookies = req.cookies;
  // If the person is not already logged in
  // -->> Does note have loginToken cookie
  if (!password || !email) {
    res.cookie('badRegister', true);
    return res.redirect('/register');
  }
  for (let id in userDatabase) {
    if (userDatabase[id]['email'] && userDatabase[id]['email'] === email) {
      res.cookie('duplicateRegister', true);
      return res.redirect('/register');
    }
  }
  if (!tripleTokenCheck(cookies)) {
    res.clearCookie('badRegister');
    res.clearCookie('duplicateRegister');
    userDatabase[userId] = {
      email,
      password,
    };
    return res.redirect('/login');
  }
  res.redirect('/urls')
});

// 
// GET HANDLERS
// 

// Route for get for root
app.get('/', (req, res) => {
  // Root redirects to /url regardless of tokens
  return res.redirect("/urls");
});

// Route for get to urls json page
app.get('/urls.json', (req, res) => {
  // loginToken cookie values
  const cookies = req.cookies;
  // Template vars contains urlDatabase subsets:
  // Generic and object matched with loginTokenID 
  const templateVars = {
    generic: JSON.stringify(urlDatabase['generic']),
    iDMatch: JSON.stringify(urlDatabase[cookies.loginTokenID]),
  };
  if (!tripleTokenCheck(cookies)) {
    return res.send(templateVars.generic);
  }
  
  return res.send(templateVars.iDMatch);
});

// Route for url page with table of urls IDs and long urls
app.get('/urls', (req, res) => {
  // loginToken cookie values
  const cookies = req.cookies;

  // Template vars contains urlDatabase subsets:
  // Generic and object matched with loginTokenID 
  const templateVars = {
    showLogin: false,
    urls: urlDatabase['generic'],
    cookies: cookies,
  };

  if (!tripleTokenCheck(cookies)) {
    templateVars.showLogin = true;
    return res.render('urls_index', templateVars);
  }

  if (tokenAuthenticator(cookies, userDatabase)) {
    templateVars.urls = urlDatabase[cookies.loginTokenID];
  }

  res.render('urls_index', templateVars);
});

// Route to page with form to post new urls
app.get('/urls/new', (req, res) => {
  // loginToken cookie values
  const cookies = req.cookies;

  const templateVars = {
    showLogin: false,
    cookies: cookies,
  };
  if (!tripleTokenCheck(cookies)) {
    templateVars.showLogin = true;
  }
  res.render('urls_new', templateVars);
});

// Route to /register page
app.get('/register', (req, res) => {
  // loginToken cookie values
  const cookies = req.cookies;

  // Template vars contains urlDatabase subsets:
  // Generic and object matched with loginTokenID 
  const templateVars = {
    showLogin: true,
    urls: urlDatabase[cookies.loginTokenID],
    cookies: cookies,
  };
  if (!tripleTokenCheck(cookies)) {
    cookies.loginTokenEmail = null;
    return res.render('urls_register', templateVars);
  }
  res.redirect('/urls')
});

// Route to /login page
app.get('/login', (req, res) => {
  // loginToken cookie values
  const cookies = req.cookies;

  // Template vars contains urlDatabase subsets:
  // Generic and object matched with loginTokenID 
  const templateVars = {
    showLogin: false,
    cookies: cookies,
  };
  if (!tripleTokenCheck(cookies)) {
    cookies.loginTokenEmail = null;
    return res.render('urls_login', templateVars);
  }
  res.redirect('/urls');
});

// Route to page for given id's url
app.get('/urls/:id', (req, res) => {

  // loginToken cookie values
  const cookies = req.cookies;

  // Template vars contains urlDatabase subsets:
  // Generic and object matched with loginTokenID 
  const templateVars = {
    showLogin: false,
    id: req.params.id, 
    longURL: null, 
    cookies: cookies,
  };
  
  
  if (!tripleTokenCheck(cookies)) {
    const idEvaluation = databaseIterator(urlDatabase, req.params.id);
    if (idEvaluation !== urlDatabase['generic'][req.params.id] || idEvaluation === false) {
      res.cookie('urlAccessDenied', true);
      return res.redirect('/urls')
    }
    templateVars.showLogin = true;
    templateVars.longURL = urlDatabase['generic'][req.params.id];
    res.clearCookie('urlAccessDenied');
    return res.render('urls_show', templateVars);
  }
  if (tokenAuthenticator(cookies, userDatabase)) {
    templateVars.longURL = urlDatabase[cookies.loginTokenID][req.params.id];
  }
  res.clearCookie('urlAccessDenied');
  return res.render('urls_show', templateVars);
});

// Route for short url redirect
app.get('/u/:id', (req, res) => {
  let targetURL = databaseIterator(urlDatabase, req.params.id);
  
  res.redirect(targetURL);
});

// Setting up listener
app.listen(PORT, () => {
  console.log(`Express server up: listening on port ${PORT}`);
});