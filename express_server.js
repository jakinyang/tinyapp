// Require express for server
const express = require('express');
// Require methodOverride
const methodOverride = require('method-override');
// Require cookie-session
const cookieSession = require('cookie-session');
// Require bcryptjs
const bcrypt = require('bcryptjs');
// Requiring helperModules
const { targetRetrieverID, tokenAuthenticator, loginCookieCheck, cookieWiper, randomStringGen } = require('./helperModules');
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
const urlDatabase = {};

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

// Get handler for '/' checks for login state
// redirects to /login or /urls
app.get('/', (req, res) => {
  const cookies = req.session;
  if (!loginCookieCheck(cookies)) {
    return res.redirect("/login");
  }

  return res.redirect("/urls");
});


app.get('/urls', (req, res) => {
  const cookies = req.session;
  const templateVars = {
    showLogin: false,
    urls: urlDatabase['generic'],
    cookies: cookies,
  };

  // If client is not logged in, render error w/ login prompt
  if (!loginCookieCheck(cookies)) {
    templateVars.showLogin = true;
    res.status(401);
    res.render('error_loginPrompt', templateVars);
  }

  // If client is logged in render urls_index with urls
  // Associated with that client's id
  if (userDatabase[cookies.loginTokenID]) {
    if (tokenAuthenticator(cookies, userDatabase)) {
      templateVars.urls = urlDatabase[cookies.loginTokenID];
      return res.render('urls_index', templateVars);
    }

    // If validation fails, wipe cookies, redirect to /login
    res.status(400);
    cookieWiper(req);
    return res.redirect('/login');
  }
});

app.get('/urls/new', (req, res) => {
  const cookies = req.session;
  const templateVars = {
    showLogin: false,
    cookies: cookies,
  };

  // Redirect to login if not logged in
  if (!loginCookieCheck(cookies)) {
    res.status(401);
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
  // If client is not logged in redirect to /login
  if (!loginCookieCheck(cookies)) {
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
  if (!loginCookieCheck(cookies)) {
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
  const cookies = req.session;
  const id = req.params.id;
  const templateVars = {
    showLogin: false,
    id: id,
    longURL: null,
    cookies: cookies,
  };
  // If id does not exist, send error of no url found
  if (!targetRetrieverID(urlDatabase, id)) {
    templateVars.showLogin = true;
    res.status(404);
    res.render('error_noUrl', templateVars);
  }
  // If client is not logged in send error with login prompt
  if (!loginCookieCheck(cookies)) {
    templateVars.showLogin = true;
    res.status(401);
    res.render('error_loginPrompt', templateVars);
  }
  // If client is logged in, check that url/id matches client id
  if (userDatabase[cookies.loginTokenID]) {
    if (tokenAuthenticator(cookies, userDatabase)) {
      if (urlDatabase[cookies.loginTokenID][id]) {
        templateVars.longURL = urlDatabase[cookies.loginTokenID][req.params.id];
        req.session.urlAccessDenied = null;
        return res.render('urls_show', templateVars);
      }
    }
    // If tokens don't match, display error and redirect
    res.status(401);
    return res.render('error_notOwner', templateVars);
  }
});

// Route for short url redirect
app.get('/u/:id', (req, res) => {
  const id = req.params.id;
  const templateVars = {
    showLogin: false,
    id: id,
    longURL: null,
    cookies: cookies,
  };

  // If url id exists, redirect
  let targetURL = targetRetrieverID(urlDatabase, id);

  // If url id doesn't exist, send 404 code
  if (!targetURL) {
    res.status(404);
    return res.render('error_noUrl', templateVars);
  }
  
  return res.redirect(targetURL);
});

// <<-------------->>
// <<---- EDIT ---->>
// <<-------------->>

app.put('/urls/:id', (req, res) => {
  // loginToken cookie values
  const cookies = req.session;
  const id = req.params.id;
  const longURL = req.body.longURL;
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

  // If user is not logged in render error page
  if (!loginCookieCheck(cookies)) {
    templateVars.showLogin = true;
    res.status(401);
    return res.render('error_loginPrompt', templateVars);
  }

  // If user is logged in
  // check that the id associated with url matches the user's id
  if (userDatabase[cookies.loginTokenID]) {
    if (tokenAuthenticator(cookies, userDatabase)) {
      for (let userid in urlDatabase) {
        if (userid[id] && userid === cookies.loginTokenID) {
          templateVars.longURL = urlDatabase[cookies.loginTokenID][id];
          urlDatabase[cookies.loginTokenID][id] = longURL;
          return res.redirect(`/urls/${id}`);
        }
      }
    }

    // If user is not owner of url
    res.status(401);
    cookieWiper(req);
    return res.render('error_notOwner', templateVars);
  }
});


// <<-------------->>
// <<---- Add ----->>
// <<-------------->>

app.post('/urls', (req, res) => {
  const cookies = req.session;
  const newkey = randomStringGen();
  const templateVars = {
    cookies: cookies,
  }

  // If user is not logged in send code 401, render error page
  if (!loginCookieCheck(cookies)) {
    templateVars.showLogin = true;
    res.status(401);
    return res.render('error_loginPrompt', templateVars);
  }
  // If user is logged in and login token is valid
  // Create new url with random key
  if (userDatabase[cookies.loginTokenID]) {
    if (tokenAuthenticator(cookies, userDatabase)) {
      urlDatabase[cookies.loginTokenID][newkey] = req.body.longURL;
      return res.redirect(`/urls/${newkey}`);
    }
    // If the client has login tokens
    //  but they don't match any in the system
    //  Render error page
    cookieWiper(req);
    res.status(401);
    return res.render('error_notOwner', templateVars);
  }
  
  return res.redirect('/urls');
});

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
  if (!loginCookieCheck(cookies)) {
    req.session.badRegister = null;
    req.session.duplicateRegister = null;
    userDatabase[userId] = {
      userId,
      email,
      password: hash,
    };
    urlDatabase[userId] = {};
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
  if (!loginCookieCheck(cookies)) {
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
  const cookies = req.session;
  const id = req.params.id;
  const templateVars = {
    cookies: cookies,
    id: id,
  };

  // If user is not logged in render error page
  if (!loginCookieCheck(cookies)) {
    templateVars.showLogin = true;
    res.status(401);
    return res.render('error_loginPrompt', templateVars);
  }

  // If user is logged in and the url is associated with user's id
  // Delete url from database
  if (userDatabase[cookies.loginTokenID]) {
    if (loginCookieCheck(cookies)) {
      if (urlDatabase[cookies.loginTokenID][id]) {
        delete urlDatabase[cookies.loginTokenID][id];
        return res.redirect('/urls');
      }
    }
    // If user is not associated with url
    cookieWiper(req);
    res.status(401);
    return res.render('error_notOwner', templateVars);
  }
  
  res.status(401);
  return res.redirect('/login');
});

// Handling post request for /logout
app.delete('/logout', (req, res) => {
  cookieWiper(req);
  return res.redirect('/login');
});

// <<-------------->>
// <<---- CALL ---->>
// <<-------------->>

// Listener Setup
app.listen(PORT, () => {
  console.log(`Express server up: listening on port ${PORT}`);
});