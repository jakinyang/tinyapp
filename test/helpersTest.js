const { assert } = require('chai');
const { userRetrieverEmail } = require('../helpers');

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
    const user = userRetrieverEmail(testUsers, 'user@example.com');
    const expectedUserID = 'userRandomID';
    assert.equal(user, expectedUserID);
  })
})