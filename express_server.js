const bcrypt = require("bcryptjs");
const cookieParser = require("cookie-parser");
const express = require("express");
const cookieSession = require("cookie-session");

const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");

app.use(cookieParser());

app.use(cookieSession({
  name: "session",
  keys: ['secretkey', 'anothersecretkey', 'etc'],

  maxAge: 24 * 60 * 60 * 1000
}))


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

const generateRandomString = function() {
  let r = Math.random().toString(36).slice(2, 8);
  console.log("random", r);
  return r;
};

const getUserByEmail = function(email, database) {
  for (const userId in database) {
    const user = users[userId];
    if (user.email === email) {
      return user;
    }
  }
};

// const getUserByEmail = function(email, database) {
//   for (const userId in users) {
//     const user = users[userId];
//     if (user.email === email) {
//       return user;
//     }
//   }
// };

const urlsForUser = function(id) {
  const userURLs = {};
  for (const url in urlDatabase) {
    if (urlDatabase[url].userID === id) {
      userURLs[url] = urlDatabase[url];
    }
  }
  return userURLs;
};

app.use(express.urlencoded({ extended: true }));

app.get("/urls", (req, res) => {
  const userID = req.session["user_id"];
  if (!userID) {
    return res.status(404).send('Please log in or register first');
  } else {
    const userURLs = urlsForUser(userID);
    const templateVars = {
      urls: userURLs,
      user: users[userID]
    };
    res.render("urls_index", templateVars);
  }
});

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/set", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
});
 
app.get("/fetch", (req, res) => {
  const a = 1;
  res.send(`a = ${a}`);
});

app.get('/shortenURL', (req, res) => {
  const templateVars = {user: users[req.session["user_id"]]};
  res.render('shortenURL', templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {user: users[req.session["user_id"]]};
  if (!req.session["user_id"]) {
    res.redirect('/login');
  }
  res.render("urls_new", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id].longURL;
  if (!longURL) {
    return res.status(404).send('This short URL does not exist');
  }
  // console.log("gjhk", longURL)
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  const userID = req.session["user_id"];
  if (!userID) {
    return res.status(403).send('Please log in or register first');
  }
  const url = urlDatabase[req.params.id];
  if (!url) {
    return res.status(500).send('Error');
  }
  if (userID !== urlDatabase[req.params.id].userID) {
    return res.status(403).send('You must be the owner to view this URL');
  }
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id].longURL,
    user: users[req.session["user_id"]],
  };
  console.log(templateVars);
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  console.log("creating new URL: ", req.body); // Log the POST request body to the console
  if (!req.session["user_id"]) {
    return res.status(400).send('Must have an account and log in to shorten URLs');
  }
  let r = generateRandomString();
  urlDatabase[r] = {longURL: req.body.longURL, userID: req.session["user_id"]};
  res.redirect(`/urls/${r}`);
});

app.post("/urls/:id/delete", (req, res) => {
  const userID = req.session["user_id"];
  const url = urlDatabase[req.params.id];

  if (!url) {
    return res.status(500).send('This short URL does not exist');
  }
  if (!userID) {
    return res.status(403).send('Please log in or register first');
  }
  if (userID !== urlDatabase[req.params.id].userID) {
    return res.status(403).send('You must be the owner to delete this URL');
  }
  console.log("/urls/:id/delete ", urlDatabase[req.params.id]);
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});

app.post("/urls/:id/edit", (req, res) => {
  console.log("clicking edit button ", urlDatabase[req.params.id]);
  res.redirect(`/urls/${req.params.id}`);
});

app.post("/editURL/:id", (req, res) => {
  console.log("/editURL/:id, longUrl: ", urlDatabase[req.params.id].longURL);
  console.log("/editURL/:id, req.body: ", req.body.newURL);
  urlDatabase[req.params.id].longURL = req.body.newURL;
  res.redirect(`/urls`);
});

app.get('/login', (req, res) => {
  if (req.session["user_id"]) {
    res.redirect('urls');
  }
  res.render('login');
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send('Please provide an email and password');
  }

  let foundUser = getUserByEmail(email, users);
  console.log(foundUser);

  if (!foundUser) {
    return res.status(400).send('No account with that email found');
  }

  // if (foundUser.password !== password) {
  //   return res.status(403).send('Passwords do not match');
  // }

  if (!bcrypt.compareSync(password, foundUser.password)) {
    return res.status(400).send('Passwords do not match');
  }

  res.cookie('user_id', foundUser.id);
  req.session.user_id = foundUser.id;
  console.log("/login ", req.body.email);
  res.redirect(`/urls`);
});

app.post("/logout", (req, res) => {
  res.clearCookie('user_id');
  req.session = null;
  res.redirect(`/login`);
});

app.get('/register', (req, res) => {
  if (req.session["user_id"]) {
    res.redirect('urls');
  }
  res.render('register');
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send('Please provide both an email and password');
  }

  let foundUser = getUserByEmail(email, users);

  if (foundUser) {
    return res.status(400).send('There is already an account with that email');
  }

  const id = Math.random().toString(36).substring(2, 5);
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync(password, salt);
  const newUser = {
    id,
    email,
    password: hashedPassword
  };

  users[id] = newUser;
  console.log(users);

  console.log("/register ", req.body.email);
  res.cookie("user_id", newUser.id);
  res.redirect(`/login`);
});