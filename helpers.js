const getUserByEmail = function(email, database) {
  //look up user based off their email
  for (const userId in database) {
    const user = database[userId];
    //compare user email to email from database
    if (user.email === email) {
      return user;
    }
  }
};

//turning all error messages to HTML
const createHTMLMessage = function(string) {
  return `<html><body>${string}</body></html>\n`;
};

const verifyRequest = function(req, res, users, urlDatabase) {
  const userID = req.session["user_id"];
  const user = users[userID];

  //checking if logged in
  if (!user) {
    res.status(403).send(createHTMLMessage("Please log in or register first"));
    return false;
  }

  const url = urlDatabase[req.params.id];

  //checking if short url exists
  if (!url) {
    res.status(500).send(createHTMLMessage("This short URL does not exist"));
    return false;
  }

  //checking if the user logged in is same as the owner of the url
  if (userID !== url.userID) {
    res.status(403).send(createHTMLMessage("You must be the owner to edit or delete this URL"));
    return false;
  }

  return true;
};

//generates a random string
const generateRandomString = function() {
  return Math.random().toString(36).slice(2, 8);
};

//returns urls owned by the logged in user
const urlsForUser = function(id, urlDatabase) {
  const userURLs = {};

  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userURLs[url] = urlDatabase[url];
    }
  }

  return userURLs;
};

module.exports = { getUserByEmail, createHTMLMessage, verifyRequest, generateRandomString, urlsForUser };