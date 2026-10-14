const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
  return !users.some(user => user.username === username);
}

const authenticatedUser = (username,password)=>{ //returns boolean
  return users.some(user => user.username === username && user.password === password);
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({message: "Username and password are required"});
  }
  if (!authenticatedUser(username, password)) {
    return res.status(401).json({message: "Invalid login. Check username and password"});
  }
  const accessToken = jwt.sign({ data: username }, "access", { expiresIn: 60 * 60 });
  req.session.authorization = { accessToken, username };
  return res.status(200).json({message: "User successfully logged in"});
});

// Add or modify a book review
regd_users.put("/auth/review/:isbn", (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({message: "Book not found"});
  const review = req.query.review;
  if (!review) return res.status(400).json({message: "Review is required"});
  book.reviews[req.session.authorization.username] = review;
  return res.status(200).json({message: `The review for the book with ISBN ${req.params.isbn} has been added/updated.`, reviews: book.reviews});
});

// Delete the logged-in user's review
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({message: "Book not found"});
  const username = req.session.authorization.username;
  if (!(username in book.reviews)) return res.status(404).json({message: "No review by this user for this book"});
  delete book.reviews[username];
  return res.status(200).json({message: `Review for the book with ISBN ${req.params.isbn} posted by the user ${username} deleted.`});
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
