const User = require("../models/User.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const saltRounds = 10;

//Signup
const signup = (req, res, next) => {
  const { email, password, fullName, username, ageRange } = req.body;

  // Check if email, password or name are provided as empty strings
  if (
    email === "" ||
    password === "" ||
    fullName === "" ||
    username === "" ||
    ageRange === ""
  ) {
    return res
      .status(400)
      .json({ message: "Provide email, password and name" });
  }

  User.findOne({ email })
    .then((foundUser) => {
      // check if same email already exists
      if (foundUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // If email is unique, proceed to hash the password
      const salt = bcrypt.genSaltSync(saltRounds);
      const hashedPassword = bcrypt.hashSync(password, salt);

      // Create new user object with hashed password
      return User.create({
        email,
        fullName,
        username,
        ageRange,
        password: hashedPassword,
      });
    })
    .then((createdUser) => {
      // Only executed if the first .then() returns a value (User.create)
      // and not if it returns a response (res.status().json())

      // Deconstruct the newly created user object to omit the password
      const { email, fullName, _id } = createdUser;

      // Create a new object that doesn't expose the password
      const user = { email, fullName, _id };
      res.status(201).json(user); // Return the user without password
    })
    .catch((err) => {
      res.status(500).json({ error: "Failed to create new user: " + err });
    });
};

//Login
const login = (req, res, next) => {
  try {
    const { email, password } = req.body;

    // check if email and password are provided
    if (email === "" || password === "") {
      return res.status(400).json({ message: "Provide email and password" });
    }

    // check if user exists
    User.findOne({ email })
      .then((foundUser) => {
        if (!foundUser) {
          // If user is not found, send error response
          return res.status(401).json({ message: "User not found" });
        }
        // Compare the provided password with the one saved in the database
        const passwordCorrect = bcrypt.compareSync(
          password,
          foundUser.password
        );

        if (passwordCorrect) {
          // Create an object that will be set as the token payload
          const { _id, email, fullName, username, role } = foundUser;
          const isAdmin = role === "admin";

          const payload = { _id, email, fullName, username, isAdmin };

          // Create a JSON Web Token and sign it
          const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
            algorithm: "HS256",
            expiresIn: "6h",
          });

          // Send the token as the response
          res.status(200).json({ authToken });
        } else {
          res.status(401).json({ message: "Unable to authenticate the user" });
        }
      })
      .catch((err) => {
        res.status(500).json({ message: "Internal Server Error" });
      });
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error" });
  }
};

//Logout
const logout = (req, res) => {
  // With JWT, logout is typically handled on the client side by removing the token
  // This endpoint can be used for any server-side cleanup if needed
  res.status(200).json({ message: "User was logged out successfully" });
};


// GET  /auth/verify  -  Used to verify JWT stored on the client
const verify = async (req, res) => {
  try {
    const userId = req.payload._id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Send complete user data including favourites
    res.status(200).json({
      ...req.payload,
      favourites: user.favourites,
    });
  } catch (err) {
    console.error("Error in verify:", err);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  signup,
  login,
  logout,
  verify,
};