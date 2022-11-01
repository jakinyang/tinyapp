const randomAlphaNumGen = () => {
  // Generate lowerCase char
  let lowerCharCode = Math.floor(Math.random() * 19) + 97;
  let lowerChar = String.fromCharCode(lowerCharCode);
  // Generate upperCase char
  let upperCharCode = Math.floor(Math.random() * 19) + 65;
  let upperChar = String.fromCharCode(upperCharCode);
  // Generate number
  let randomNum = Math.floor(Math.random() * 10);
  return [lowerChar, upperChar, randomNum]
}

const randomIndexGen = () => {
  return Math.floor(Math.random() * 18);
}

const randomStringGen = () => {
  let alphaNumArr = [];
  let outputArr = [];
  for (let i = 0; i < 6; i++) {
    alphaNumArr = alphaNumArr.concat(randomAlphaNumGen());
  }
  for(let j = 0; j < 6; j++) {
    outputArr.push(alphaNumArr[randomIndexGen()]);
  }
  return outputArr.join('');
}

module.exports = { randomStringGen }