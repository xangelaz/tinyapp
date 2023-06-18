const cookieParser = require('cookie-parser')
const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

app.use(cookieParser());
app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

function generateRandomString() {
  let r = Math.random().toString(36).slice(2, 8);
  console.log("random", r);
  return r
}

app.use(express.urlencoded({ extended: true }));

app.get("/urls", (req, res) => {
  const templateVars = { 
    urls: urlDatabase, 
    username: req.cookies["username"] 
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
  res.send(`a = ${a}`);
 });

 app.get('/shortenURL', (req, res) => {
  const templateVars = {username: req.cookies["username"]}
  res.render('shortenURL', templateVars);
 });

 app.get("/urls/new", (req, res) => {
  const templateVars = {username: req.cookies["username"]}
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
    username: req.cookies["username"], 
    };
  res.render("urls_show", templateVars);
});

app.post("/urls", (req, res) => {
  console.log("created new URL: ", req.body); // Log the POST request body to the console
  
  let r = generateRandomString();
  urlDatabase[r] = req.body.longURL 
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
  console.log("/editURL/:id, req.body: ", req.body.newURL)
  urlDatabase[req.params.id] = req.body.newURL;
  res.redirect(`/urls`);
});

app.post("/login", (req, res) => {
  console.log("/urls/login ", req.body.username);
  res.cookie("username", req.body.username);
  res.redirect(`/urls`);
});