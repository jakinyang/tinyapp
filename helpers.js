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

module.exports = { userRetrieverEmail };