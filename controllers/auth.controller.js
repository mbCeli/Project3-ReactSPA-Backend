const User = require("../models/User.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const saltRounds = 10;

//Signup
const signup = (req, res, next) => {
  const { email, password, fullName, username, ageRange } = req.body;

  if (!email || !password || !fullName || !username || !ageRange) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields." });
  }


  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return res
      .status(400)
      .json({ message: "Please provide a valid email address." });
  }


  if (password.length < 5) {
    return res
      .status(400)
      .json({ message: "Password must be at least 6 characters long." });
  }

  // Check for existing user
  User.findOne({ email })
    .then((foundUser) => {
      // Check if same email already exists
      if (foundUser) {
        return res
          .status(400)
          .json({ message: "User with this email already exists." });
      }

      return User.findOne({ username }).then((foundUsername) => {
        if (foundUsername) {
          return res
            .status(400)
            .json({ message: "Username is already taken." });
        }

        // If email and username are unique, proceed to hash the password
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
      });
    })
    .then((createdUser) => {
      // Only executed if the previous .then() returns a value (User.create)
      // and not if it returns a response (res.status().json())
      if (!createdUser) return; // Skip if previous step returned a response

      // Deconstruct the newly created user object to omit the password
      const { email, fullName, _id } = createdUser;

      // Create a new object that doesn't expose the password
      const user = { email, fullName, _id };
      res.status(201).json({ user, message: "User created successfully!" });
    })
    .catch((err) => {
      console.error("Signup error:", err);

      // Check for specific MongoDB validation errors
      if (err.name === "ValidationError") {
        // Extract specific validation error messages
        const errorMessages = Object.values(err.errors).map((e) => e.message);
        return res.status(400).json({ message: errorMessages.join(", ") });
      }

      // Handle other specific MongoDB errors
      if (err.code === 11000) {
        // Duplicate key error
        const field = Object.keys(err.keyPattern)[0];
        return res.status(400).json({
          message: `The ${field} is already in use. Please choose another one.`,
        });
      }

      // Generic error response
      res
        .status(500)
        .json({
          message: "Failed to create new user. Please try again later.",
        });
    });
};

//Login
const login = (req, res, next) => {
  try {
    const { email, password } = req.body;

    // check if email and password are provided
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Please provide both email and password." });
    }

    // check if user exists
    User.findOne({ email })
      .then((foundUser) => {
        if (!foundUser) {
          // If user is not found, send error response
          return res.status(401).json({ message: "Invalid credentials." });
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
          res.status(401).json({ message: "Invalid credentials." });
        }
      })
      .catch((err) => {
        console.error("Login error:", err);
        res
          .status(500)
          .json({
            message: "An error occurred during login. Please try again.",
          });
      });
  } catch (error) {
    console.error("Login exception:", error);
    res.status(500).json({ message: "Server error. Please try again later." });
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
    res
      .status(500)
      .json({ message: "Authentication error. Please log in again." });
  }
};

module.exports = {
  signup,
  login,
  logout,
  verify,
};
