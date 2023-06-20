const bcrypt = require("bcryptjs");
const express = require("express");
const cookieSession = require("cookie-session");
const { getUserByEmail, createHTMLMessage, verifyRequest, generateRandomString, urlsForUser } = require("./helpers");

const app = express();
const PORT = 8080;

// configuration
app.set("view engine", "ejs");

//middleware
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: "session",
  keys: ["secretkey", "anothersecretkey", "etc"],

  maxAge: 24 * 60 * 60 * 1000
}));

const urlDatabase = {
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "aJ48lW",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "aJ48lW",
  },
};

const users = {
  abc: {
    id: "abc",
    email: "a@a.com",
    password: "1234",
  },
  def: {
    id: "def",
    email: "b@b.com",
    password: "5678",
  },
};

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

//landing page, redirects to /urls if user is logged in, otherwise redirects to /login
app.get("/", (req, res) => {
  const user = users[req.session["user_id"]];

  if (user) {
    return res.redirect("/urls");
  }

  res.redirect("/login");
});

//checks if user is logged in to then show list of urls
app.get("/urls", (req, res) => {
  const userID = req.session["user_id"];
  const user = users[userID];

  if (!user) {
    return res.status(404).send(createHTMLMessage("Please log in or register first"));
  } else {
    const templateVars = {
      urls: urlsForUser(userID, urlDatabase),
      user
    };

    res.render("urls_index", templateVars);
  }
});

//checks if user is logged in, redirects to /login if not logged in
app.get("/urls/new", (req, res) => {
  const templateVars = { user: users[req.session["user_id"]] };

  if (!req.session["user_id"]) {
    res.redirect("/login");
  }

  res.render("urls_new", templateVars);
});

//checks if the long url is in database, if not returns message, if so redirects to long url website
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;

  if (!longURL) {
    return res.status(404).send(createHTMLMessage("This short URL does not exist"));
  }

  res.redirect(longURL);
});

//completes all verifyRequest checks, then creates templateVars object
app.get("/urls/:id", (req, res) => {
  if (verifyRequest(req, res, users, urlDatabase)) {

    const templateVars = {
      id: req.params.id,
      longURL: urlDatabase[req.params.id].longURL,
      user: users[req.session["user_id"]],
    };
  
    res.render("urls_show", templateVars);
  }
});

//checks if user is logged in, if so, creates new short url and redirects to urls/shorturl
app.post("/urls", (req, res) => {
  if (!req.session["user_id"]) {
    return res.status(400).send(createHTMLMessage("Must have an account and log in to shorten URLs"));
  }

  const r = generateRandomString();

  urlDatabase[r] = {longURL: req.body.longURL, userID: req.session["user_id"]};

  res.redirect(`/urls/${r}`);
});

//completes all checks of verifyRequest, deletes the short url object and redirects to /urls
app.post("/urls/:id/delete", (req, res) => {
  if (verifyRequest(req, res, users, urlDatabase)) {
    delete urlDatabase[req.params.id];

    res.redirect(`/urls`);
  }
});

//completes all checks of verifyRequest, replaces the long url with the entered url, redirects to /urls
app.post("/urls/:id", (req, res) => {
  if (verifyRequest(req, res, users, urlDatabase)) {
    urlDatabase[req.params.id].longURL = req.body.newURL;

    res.redirect(`/urls`);
  }
});

//checks if user is logged in, if so, will redirect to urls, otherwise goes to /login
app.get("/login", (req, res) => {
  const user = users[req.session["user_id"]];

  if (user) {
    res.redirect("urls");
  }

  res.render("login");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  //checking if user provided an email and password
  if (!email || !password) {
    return res.status(400).send(createHTMLMessage("Please provide an email and password"));
  }

  const foundUser = getUserByEmail(email, users);

  //checking if the email entered is registered
  if (!foundUser) {
    return res.status(400).send(createHTMLMessage("No account with that email found"));
  }

  //checking if password entered is the same as registered password
  if (!bcrypt.compareSync(password, foundUser.password)) {
    return res.status(400).send(createHTMLMessage("Passwords do not match"));
  }

  //creates cookie and session
  res.cookie("user_id", foundUser.id);
  req.session["user_id"] = foundUser.id;
  res.redirect(`/urls`);
});

//clears the users cookie and session, redirects to /login
app.post("/logout", (req, res) => {
  res.clearCookie("user_id");
  req.session = null;
  res.redirect(`/login`);
});

//checking if user logged in, if so, redirect to urls, otherwise go to register page
app.get("/register", (req, res) => {
  const user = users[req.session["user_id"]];

  if (user) {
    res.redirect("urls");
  }

  res.render("register");
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  //checking if user provided an email and password
  if (!email || !password) {
    return res.status(400).send(createHTMLMessage("Please provide both an email and password"));
  }

  const foundUser = getUserByEmail(email, users);

  //checking if email entered is already registered
  if (foundUser) {
    return res.status(400).send(createHTMLMessage("There is already an account with that email"));
  }

  //creates new user object
  const id = generateRandomString();
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);
  const newUser = {
    id,
    email,
    password: hashedPassword
  };

  //updates the user object
  users[id] = newUser;

  res.cookie("user_id", newUser.id);
  res.redirect(`/login`);
});