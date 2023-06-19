const cookieParser = require('cookie-parser');
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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

app.use(express.urlencoded({ extended: true }));

app.get("/urls", (req, res) => {
  const templateVars = {
    urls: urlDatabase,
    user: users[req.cookies["user_id"]]
  };
  res.render("urls_index", templateVars);
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
  const templateVars = {user: users[req.cookies["user_id"]]};
  res.render('shortenURL', templateVars);
});

app.get("/urls/new", (req, res) => {
  const templateVars = {user: users[req.cookies["user_id"]]};
  res.render("urls_new", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  // console.log("gjhk", longURL)
  res.redirect(longURL);
});

app.get("/urls/:id", (req, res) => {
  const templateVars = {
    id: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies["user_id"]],
  };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  console.log("created new URL: ", req.body); // Log the POST request body to the console
  
  let r = generateRandomString();
  urlDatabase[r] = req.body.longURL;
  res.redirect(`/urls/${r}`);
});

app.post("/urls/:id/delete", (req, res) => {
  console.log("/urls/:id/delete ", urlDatabase[req.params.id]);
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});

app.post("/urls/:id/edit", (req, res) => {
  console.log("clicking edit button ", urlDatabase[req.params.id]);
  res.redirect(`/urls/${req.params.id}`);
});

app.post("/editURL/:id", (req, res) => {
  console.log("/editURL/:id, longUrl: ", urlDatabase[req.params.id]);
  console.log("/editURL/:id, req.body: ", req.body.newURL);
  urlDatabase[req.params.id] = req.body.newURL;
  res.redirect(`/urls`);
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send('Please provide an email and password');
  }

  let foundUser = null;
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      foundUser = user;
    }
  }

  if (!foundUser) {
    return res.status(403).send('No account with that email found');
  }

  if (foundUser.password !== password) {
    return res.status(403).send('Passwords do not match');
  }

  res.cookie('user_id', foundUser.id);
  console.log("/login ", req.body.email);
  res.redirect(`/urls`);
});

app.post("/logout", (req, res) => {
  console.log("/logout ", req.body.email);
  res.clearCookie('user_id');
  res.redirect(`/login`);
});

app.get('/register', (req, res) => {
  res.render('register');
});

app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  if (!email || !password) {
    return res.status(400).send('Please provide both an email and password');
  }

  let foundUser = null;
  for (const userId in users) {
    const user = users[userId];
    if (user.email === email) {
      foundUser = user;
    }
  }

  if (foundUser) {
    return res.status(400).send('There is already an account with that email');
  }

  const id = Math.random().toString(36).substring(2, 5);

  const newUser = {
    id,
    email,
    password
  };

  users[id] = newUser;
  console.log(users);

  console.log("/register ", req.body.email);
  res.cookie("user_id", newUser.id);
  res.redirect(`/urls`);
});