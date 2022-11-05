const { assert } = require('chai');
const { userRetrieverEmail } = require('../helperModules');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('#userRetrieverEmail', () => {
  it('should return the user object with matching target email', () => {
    const actualOutput = userRetrieverEmail(testUsers, 'user@example.com');
    const expectedOutput = 'userRandomID';
    assert.equal(actualOutput, expectedOutput);
  });
  it('should return false if no object has matching target email', () => {
    const actualOutput = userRetrieverEmail(testUsers, 'user@pitvipers.com');
    const expectedOutput = false;
    assert.equal(actualOutput, expectedOutput);
  });
});