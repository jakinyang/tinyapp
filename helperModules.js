/**
 * Takes a database (object) and a target string as parameters. Iterates over nested objects and returns the nested object with email that matches target email string. If no match, returns false
 * */
const userRetrieverEmail = (database, targetEmail) => {
  for (let subDatabase in database) {
    for (let id in database[subDatabase]) {
      if (database[subDatabase]['email'] === targetEmail) {
        return database[subDatabase][id];
      }
    }
  }
  return false;
};



/**
 * Takes a database (object) and a target string as parameters.Iterates over nested objects and returns the nested object with key that matches targetId. If no match, returns false
 * */
const targetRetrieverID = (database, targetId) => {
  for (let subDatabase in database) {
    for (let id in database[subDatabase]) {
      if (id === targetId) {
        return database[subDatabase][id];
      }
    }
  }
  return false;
};

/**
 * Takes an object with ID key/value. It then checks database to make sure the id matches. Returns boolean.
 * */
const tokenAuthenticator = (tokenObject, database) => {
  const id = tokenObject.loginTokenID;
  if (id === database[id]['userId']) {
    return true;
  }
  return false;
};

/**
 * Takes an object and checks that it has values for loginToken ID. Returns true if found, false if not.
 * */
const tripleTokenCheck = (tokenObject) => {
  if (!tokenObject.loginTokenID) {
    return false;
  }
  return true;
};

/**
 * Takes an object and checks that it has values for loginToken ID, Password, and Email. Returns boolean
 * */
const cookieWiper = (req) => {
  req.session = null;
};

/**
 * Returns an array of a random uppercase, lowercase, and number
 * */
const randomAlphaNumGen = () => {
  // Generate lowerCase char
  let lowerCharCode = Math.floor(Math.random() * 19) + 97;
  let lowerChar = String.fromCharCode(lowerCharCode);
  // Generate upperCase char
  let upperCharCode = Math.floor(Math.random() * 19) + 65;
  let upperChar = String.fromCharCode(upperCharCode);
  // Generate number
  let randomNum = Math.floor(Math.random() * 10);
  return [lowerChar, upperChar, randomNum];
};

/**
 * Generates a random number up to 18 to be used as an index.
 * */
const randomIndexGen = () => {
  return Math.floor(Math.random() * 18);
};


/**
 * Calls randomAlphaNumGen and randomIndexGen and returns a 6 char long alphanumeric string
 * */
const randomStringGen = () => {
  let alphaNumArr = [];
  let outputArr = [];
  for (let i = 0; i < 6; i++) {
    alphaNumArr = alphaNumArr.concat(randomAlphaNumGen());
  }
  for (let j = 0; j < 6; j++) {
    outputArr.push(alphaNumArr[randomIndexGen()]);
  }
  return outputArr.join('');
};

module.exports = { targetRetrieverID, userRetrieverEmail, tokenAuthenticator, tripleTokenCheck, cookieWiper, randomStringGen };