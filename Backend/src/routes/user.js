require("dotenv").config({
  path: require("path").resolve(__dirname, "../../.env"),
});
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { User } = require("../models/user.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res
        .status(400)
        .json({ msg: "Please fill the required credentials!" });
    }
    const existingUser = await User.findOne({ username: username });
    if (!existingUser) {
      return res.status(400).json({ msg: "User doesnt exist!" });
    }
    else {
      const isMatch = await bcrypt.compare(password, existingUser.password);
      if (!isMatch) {
        return res.status(400).json({ msg: "Invalid password" });
      }
      //generate the token and send it to the backend using jwt.sign and secret key
      const token = jwt.sign(
        { id: existingUser._id, username: existingUser.username },
        process.env.JWT_SECRET,
        { expiresIn: "7d" },
      );
      res.json({ token, username: existingUser.username });
    }
  } 
  catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
router.post("/register", async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if(!username||!password){
        return res.status(400).json({ msg: "Please fill the required credentials!" });
    }
    const existingUser = await User.findOne({ username: username });
    if (!existingUser) {
      const hashedPassword = await bcrypt.hash(password, 10);
      let newUser = await User.create({
        username: username,
        email: email,
        password: hashedPassword,
      });
      return res.json({ msg: "User has been added Successfully!" });
    } else {
      return res.status(400).json({ msg: "User already exists!" });
    }
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});
module.exports = router;