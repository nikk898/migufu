const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cookieParser = require('cookie-parser');
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

function generateAccessToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, process.env.ACCESS_SECRET, {
    expiresIn: "15m",
  });
}

function generateRefreshToken(user) {
  return jwt.sign({ id: user.id, email: user.email }, process.env.REFRESH_SECRET, {
    expiresIn: "7d",
  });
}
