/**
 * Iterates over nested objects and returns the nested object with key that matches targetId. If no match, returns false
 * */
const databaseIterator = (database, targetId) => {
  for (let subDatabase in database) {
    for (let id in database[subDatabase]) {
      if (id === targetId) {
        return database[subDatabase][id];
      }
    }
  }
  return false;
}

/**
 * Takes an object with ID, Email, and Password tokens; iterates over database to make sure both email and password in object of that ID match. Returns boolean.
 * */
const tokenAuthenticator = (tokenObject, database) => {
  const id = tokenObject.loginTokenID;
  const email = tokenObject.loginTokenEmail;
  const password = tokenObject.loginTokenPass;
  if (email === database[id]['email'] && password === database[id]['password']) {
    return true;
  }
  return false;
}
module.exports = { databaseIterator, tokenAuthenticator, }