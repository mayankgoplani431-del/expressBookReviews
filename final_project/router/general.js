const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = "http://localhost:5000";

public_users.post("/register", (req,res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({message: "Username and password are required"});
  }
  if (!isValid(username)) {
    return res.status(409).json({message: "User already exists!"});
  }
  users.push({ username, password });
  return res.status(200).json({message: "User successfully registered. Now you can login"});
});

// Raw book data, served as JSON so the routes below can fetch it with Axios
public_users.get('/booksdata', (req, res) => res.status(200).json(books));

// Fetch the book data with Axios (returns a promise)
const fetchBooks = () => axios.get(`${BASE_URL}/booksdata`).then(response => response.data);

// Get the book list available in the shop (promise callbacks)
public_users.get('/', function (req, res) {
  fetchBooks()
    .then(allBooks => res.status(200).send(JSON.stringify(allBooks, null, 4)))
    .catch(() => res.status(500).json({message: "Unable to retrieve books"}));
});

// Get book details based on ISBN (async/await)
public_users.get('/isbn/:isbn', async function (req, res) {
  try {
    const allBooks = await fetchBooks();
    const book = allBooks[req.params.isbn];
    if (!book) return res.status(404).json({message: "Book not found"});
    return res.status(200).json(book);
  } catch (err) {
    return res.status(500).json({message: "Unable to retrieve books"});
  }
});

// Get book details based on author (async/await)
public_users.get('/author/:author', async function (req, res) {
  try {
    const allBooks = await fetchBooks();
    const author = req.params.author.toLowerCase();
    const result = Object.entries(allBooks)
      .filter(([, b]) => b.author.toLowerCase() === author)
      .map(([isbn, b]) => ({ isbn, ...b }));
    if (result.length === 0) return res.status(404).json({message: "No books found for this author"});
    return res.status(200).json({ booksbyauthor: result });
  } catch (err) {
    return res.status(500).json({message: "Unable to retrieve books"});
  }
});

// Get all books based on title (async/await)
public_users.get('/title/:title', async function (req, res) {
  try {
    const allBooks = await fetchBooks();
    const title = req.params.title.toLowerCase();
    const result = Object.entries(allBooks)
      .filter(([, b]) => b.title.toLowerCase() === title)
      .map(([isbn, b]) => ({ isbn, ...b }));
    if (result.length === 0) return res.status(404).json({message: "No books found with this title"});
    return res.status(200).json({ booksbytitle: result });
  } catch (err) {
    return res.status(500).json({message: "Unable to retrieve books"});
  }
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  const book = books[req.params.isbn];
  if (!book) return res.status(404).json({message: "Book not found"});
  return res.status(200).json(book.reviews);
});

// Client-side helpers using Axios against the routes above (the server must be running).
// Promise callbacks: all books
const getAllBooks = () =>
  axios.get(`${BASE_URL}/`).then(response => response.data);

// async/await: book by ISBN
const getBookByISBN = async (isbn) => {
  const response = await axios.get(`${BASE_URL}/isbn/${encodeURIComponent(isbn)}`);
  return response.data;
};

// async/await: books by author
const getBooksByAuthor = async (author) => {
  const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
  return response.data;
};

// async/await: books by title
const getBooksByTitle = async (title) => {
  const response = await axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`);
  return response.data;
};

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
