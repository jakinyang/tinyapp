// Require express for server
const express = require('express');
// Require methodOverride
const methodOverride = require('method-override');
// Require cookie-session
const cookieSession = require('cookie-session');
// Require bcryptjs
const bcrypt = require('bcryptjs');
// Requiring helperModules
const { targetRetrieverID, tokenAuthenticator, tripleTokenCheck, cookieWiper, randomStringGen } = require('./helperModules');
// Require morgan
const morgan = require('morgan');
// Requiring cookieParser
// Assign the server instance to a const
const app = express();

const PORT = 8080;

// <<------------------>>
// <<- Mock Databases ->>
// <<------------------>>

// URL Database - Stand in for a backend database
const urlDatabase = {
  generic: {
    'b2xVn2': "http://lighthouselabs.ca",
    '9sm5xK': "http://www.google.com",
  },
};

// User database
const userDatabase = {};

// <<----------------------->>
// <<- Set up & middleware ->>
// <<----------------------->>

app.set('view engine', 'ejs');

app.use(express.urlencoded({ extended: true}));

app.use(morgan('dev'));

app.use(cookieSession({
  name: "sesh",
  keys: ['1a0b2c9d3e8', 'fOrTmOo2000'],
}));

app.use(methodOverride('_method'));

// <<-------------------------------->>
// <<- MAIN CODE + REQUEST HANDLERS ->>
// <<-------------------------------->>

// <<-------------->>
// <<--- BROWSE --->>
// <<-------------->>

app.get('/', (req, res) => {
  const cookies = req.session;
  if (!tripleTokenCheck(cookies)) {
    return res.redirect("/login");
  }
  return res.reditect("/urls");
});

// Route for url page with table of urls IDs and long urls
app.get('/urls', (req, res) => {
  // loginToken cookie values
  const cookies = req.session;

  // Template vars contains urlDatabase subsets:
  // Generic and object matched with loginTokenID
  const templateVars = {
    showLogin: false,
    urls: urlDatabase['generic'],
    cookies: cookies,
  };

  // If login tokens not present, redirect to /login
  if (!tripleTokenCheck(cookies)) {
    templateVars.showLogin = true;
    res.render('error_loginPrompt', templateVars);
  }
  // If login tokens present
  if (userDatabase[cookies.loginTokenID]) {
    // Validate if tokens match
    if (tokenAuthenticator(cookies, userDatabase)) {
      // If validated, display urls for that id
      templateVars.urls = urlDatabase[cookies.loginTokenID];
      return res.render('urls_index', templateVars);
    }
    // If validation fails, wipe cookies, redirect to /login
    res.status(401);
    cookieWiper(req);
    return res.redirect('/login');
  }
});

// Route to page with form to post new urls
app.get('/urls/new', (req, res) => {
  // loginToken cookie values
  const cookies = req.session;

  const templateVars = {
    showLogin: false,
    cookies: cookies,
  };
  // Check for login tokens
  if (!tripleTokenCheck(cookies)) {
    templateVars.showLogin = true;
    return res.redirect('/login');
  }

  return res.render('urls_new', templateVars);
});

// Route to /register page
app.get('/register', (req, res) => {
  // loginToken cookie values
  const cookies = req.session;

  // Template vars contains urlDatabase subsets:
  // Generic and object matched with loginTokenID
  const templateVars = {
    showLogin: true,
    urls: urlDatabase[cookies.loginTokenID],
    cookies: cookies,
  };
  // Check for login tokens
  if (!tripleTokenCheck(cookies)) {
    cookies.loginTokenEmail = null;
    return res.render('urls_register', templateVars);
  }
  // If login tokens already present, redirecdt to /urls
  return res.redirect('/urls');
});

// Route to /login page
app.get('/login', (req, res) => {
  // loginToken cookie values
  const cookies = req.session;

  // Template vars contains urlDatabase subsets:
  // Generic and object matched with loginTokenID
  const templateVars = {
    showLogin: true,
    cookies: cookies,
  };
  if (!tripleTokenCheck(cookies)) {
    cookies.loginTokenEmail = null;
    return res.render('urls_login', templateVars);
  }
  return res.redirect('/urls');
});

// <<-------------->>
// <<---- READ ---->>
// <<-------------->>

// Route to page for given id's url
app.get('/urls/:id', (req, res) => {

  // loginToken cookie values
  const cookies = req.session;

  // Template vars contains urlDatabase subsets:
  // Generic and object matched with loginTokenID
  const templateVars = {
    showLogin: false,
    id: req.params.id,
    longURL: null,
    cookies: cookies,
  };
  
  // Check for login tokens
  if (!tripleTokenCheck(cookies)) {
    // checking if the id is present in the database
    const idEvaluation = targetRetrieverID(urlDatabase, req.params.id);
    // If url id is present but not associated with current
    // Login tokens
    if (idEvaluation !== urlDatabase['generic'][req.params.id] || idEvaluation === false) {
      // Return appropriate status
      res.status(401);
      req.session.urlAccessDenied = true;
      return res.redirect('/urls');
    }
    // Otherwise, show url if it is a generic url
    templateVars.showLogin = true;
    templateVars.longURL = urlDatabase['generic'][req.params.id];
    req.session.urlAccessDenied = null;
    return res.render('urls_show', templateVars);
  }
  // If user is logged in, authenticate all login tokens
  if (userDatabase[cookies.loginTokenID]) {
    if (tokenAuthenticator(cookies, userDatabase)) {
      // If tokens match, display url for that id
      templateVars.longURL = urlDatabase[cookies.loginTokenID][req.params.id];
      req.session.urlAccessDenied = null;
      return res.render('urls_show', templateVars);
    }
    // If tokens don't match, display error and redirect
    res.status(401);
    req.session.urlAccessDenied = true;
    return res.redirect('/urls');
  }
});

// Route for short url redirect
app.get('/u/:id', (req, res) => {
  // If url id exists, redirect
  let targetURL = targetRetrieverID(urlDatabase, req.params.id);
  // If url id doesn't exist, send 404 code
  if (!targetURL) {
    res.status(404);
    return res.send('Code 404: Cannot find url id');
  }
  
  return res.redirect(targetURL);
});

// <<-------------->>
// <<---- EDIT ---->>
// <<-------------->>

// Handling post update request from urls/:id/
app.put('/urls/:id', (req, res) => {
  // loginToken cookie values
  const cookies = req.session;
  const id = req.params.id;
  const longURL = req.body.longURL;
  // Template vars contains urlDatabase subsets:
  // Generic and object matched with loginTokenID
  const templateVars = {
    cookies: cookies,
    id: id,
    longURL: null,
  };
  
  // If the no input is given to the edit form field
  // Redirect to current page
  if (!longURL) {
    res.status(400);
    return res.redirect(`/urls/${id}`);
  }

  // If no login tokens, redirect to /login
  // Send 401 code
  if (!tripleTokenCheck(cookies)) {
    res.status(401);
    return res.redirect('/login');
  }

  // If login tokens, validate
  if (userDatabase[cookies.loginTokenID]) {
    if (tokenAuthenticator(cookies, userDatabase)) {
      // If tokens validate, update url id with new longURL
      for (let userid in urlDatabase) {
        if (userid === cookies.loginTokenID) {
          templateVars.longURL = urlDatabase[cookies.loginTokenID][id];
          urlDatabase[cookies.loginTokenID][id] = longURL;
          return res.redirect(`/urls/${id}`);
        }
      }
    }
    // If authentication fails, redirect to current page
    // Wipe cookies => auto redirect to /login
    res.status(401);
    cookieWiper(req);
    return res.redirect(`/urls/${id}`);
  }
});


// <<-------------->>
// <<---- Add ----->>
// <<-------------->>

// Handling post request from urls/new
app.post('/urls', (req, res) => {
  // loginToken cookie values
  const cookies = req.session;
  // New random short urlID
  const newkey = randomStringGen();

  // Checking for login tokens -->> if not logged in
  if (!tripleTokenCheck(cookies)) {
    res.status(401);
    res.send("Permission Denied");
    return res.redirect('/login');
  }
  // Checking that login tokens are all intermatching
  if (userDatabase[cookies.loginTokenID]) {
    if (tokenAuthenticator(cookies, userDatabase)) {
      if (!urlDatabase[cookies.loginTokenID]) {
        // If first time making new tinyURL, initialize object for ID
        urlDatabase[cookies.loginTokenID] = {};
      }
      // Post long url and ID in object at loginTokenID
      urlDatabase[cookies.loginTokenID][newkey] = req.body.longURL;
      return res.redirect(`/urls/${newkey}`);
    }
    // If the browser/client has loginToken cookies
    //  but they don't match any in the system
    //  then redirect with generic
    cookieWiper(req);
    urlDatabase['generic'][newkey] = req.body.longURL;
    return res.redirect('/urls');
  }
  // Vague edge-cases, just redirect to generic
  urlDatabase['generic'][newkey] = req.body.longURL;
  return res.redirect('/urls');
});

// Handling post request for /regsiter
app.post('/register', (req, res) => {
  const userId = randomStringGen();
  const password = req.body.password;
  const hash = bcrypt.hashSync(password, 10);
  const email = req.body.email;
  const cookies = req.session;
  // If the person is not already logged in
  // If they did not enter a password or email in form
  if (!password || !email) {
    res.status(400);
    req.session.badRegister = true;
    return res.redirect('/register');
  }
  // If the email they entered already exists in userDatabase
  for (let id in userDatabase) {
    if (userDatabase[id]['email'] && userDatabase[id]['email'] === email) {
      res.status(400);
      req.session.duplicateRegister = true;
      return res.redirect('/register');
    }
  }

  // If they are not already logged in
  // And the request body email and password are valid
  if (!tripleTokenCheck(cookies)) {
    req.session.badRegister = null;
    req.session.duplicateRegister = null;
    userDatabase[userId] = {
      userId,
      email,
      password: hash,
    };
    return res.redirect('/login');
  }

  // Otherwise, they're already logged in
  // Auto redirect to /urls
  res.redirect('/urls');
});

app.post('/login', (req, res) => {
  const password = req.body.password;
  const email = req.body.email;
  const cookies = req.session;
  // Check for login cookies
  if (!tripleTokenCheck(cookies)) {
    for (let id in userDatabase) {
      // Check for matching email and password for id
      if (userDatabase[id]['email'] === email && bcrypt.compareSync(password, userDatabase[id]['password'])) {
        // Assign values in database to login tokens
        req.session.loginTokenID =  id;
        req.session.loginTokenEmail = email;
        // If successful, clear any bad marker cookies
        if (req.session.badLogin) {
          req.session.badLogin = null;
        }
        // Redirect to /urls with login cookies
        return res.redirect('/urls');
      }
    }

    // If login matching fails
    // And they don't already have the bad login token
    if (!cookies.badLogin) {
      res.status(400);
      req.session.badLogin = true;
    }
    // Redirect to login and set response status to 403
    res.status(403);
    return res.redirect('/login');
  }
  // If they are logged in
  // They have all loginTokens
  return res.redirect('/urls');
});

// <<-------------->>
// <<--- DELETE --->>
// <<-------------->>

// Handling post delete request from urls/:id/delete
app.delete('/urls/:id/delete', (req, res) => {
  // loginToken cookie values
  const cookies = req.session;
  const id = req.params.id;
  // Validate login tokens
  if (userDatabase[cookies.loginTokenID]) {
    if (tripleTokenCheck(cookies)) {
      // Validate if the url deleted is associated with id
      if (urlDatabase[cookies.loginTokenID][id]) {
        delete urlDatabase[cookies.loginTokenID][id];
        return res.redirect('/urls');
      }
    }
    // If validation fails, send code 401, wipe cookies
    res.status(401);
    cookieWiper(req);
  }
  // If url is not associated with an id, but is generic
  // Send code 404 and redirect
  if (urlDatabase['generic'][id]) {
    res.status(404);
    return res.redirect('/urls');
  }
  res.status(401);
  return res.redirect('/urls');
});

// Handling post request for /logout
app.delete('/logout', (req, res) => {
  cookieWiper(req);
  res.redirect('/login');
});

// <<-------------->>
// <<---- CALL ---->>
// <<-------------->>

// Listener Setup
app.listen(PORT, () => {
  console.log(`Express server up: listening on port ${PORT}`);
});