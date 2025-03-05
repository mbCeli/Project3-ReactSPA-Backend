const User = require("../models/User.model");
const bcrypt = require("bcrypt"); //to hash the password when creating a new user
const saltRounds = 10;

//GET all users
const getAllUsers = (req, res) => {
  User.find({})
    .then((users) => {
      console.log("All users retrieved ->", users);
      res.status(200).json(users);
    })
    .catch((err) => {
      console.log(err, "Error to show users");
      res.status(500).json({ error: "Failed to retrieve users" + err });
    });
};

//GET one user
const getOneUser = (req, res) => {
  const { userId } = req.params; //we are doing a request to the parameters of the "model" specifically to the user Id

  User.findById(userId)
    .then((user) => {
      console.log("User retrieved ->", user);
      res.status(200).json(user);
    })
    .catch((err) => {
      console.log(err, "Error to show user");
      res.status(500).json({ error: "Failed to retrieve user" + err });
    });
};

//POST new user

//POST new user
const createNewUser = async (req, res) => {
  try {
    // Check if password is provided
    if (!req.body.password) {
      return res.status(400).json({ message: "Password is required" });
    }
    
    // Hash the password
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);
    
    // Replace plaintext password with hashed one
    const userData = {
      ...req.body,
      password: hashedPassword
    };
    
    const createdUser = await User.create(userData);
    console.log("Created new user ->", createdUser);
    res.status(201).json(createdUser);
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Failed to create new user: " + err.message });
  }
};

// const createNewUser = (req, res) => {
  
//   if (!req.body.password) {
//     return res.status(400).json({ message: "Password is required" });
//   }
  

//   // Hash the password
//   const salt = bcrypt.genSaltSync(saltRounds);
//   const hashedPassword = bcrypt.hashSync(req.body.password, salt);

//   const userData = {
//     ...req.body,
//     password: hashedPassword,
//   };

//   User.create(userData)
//     .then((createUser) => {
//       console.log("Created new user ->", createUser);
//       res.status(201).json(createUser);
//     })
//     .catch((err) => {
//       console.log(err, "Error to create user");
//       res.status(500).json({ error: "Failed to create new user" + err });
//     });
// };

//PUT to update a user
const updateUser = (req, res) => {
  const { userId } = req.params;

  User.findByIdAndUpdate(userId, req.body, { new: true })
    .then((updateUser) => {
      if (!updateUser) {
        return res.status(404).json({ message: "User not found" });
      }
      console.log("Updated user ->", updateUser);
      res.status(204).json(updateUser);
    })
    .catch((err) => {
      console.log(err, "Error to update user");
      res.status(500).json({ error: "Failed to update user" + err });
    });
};

const deleteUser = (req, res) => {
  const { userId } = req.params;

  User.findByIdAndDelete(userId)
    .then((deleteUser) => {
      if (!deleteUser) {
        return res.status(404).json({ message: "User not found" });
      }
      console.log("User deleted");
      res.status(204).send();
    })
    .catch((err) => {
      console.log(err, "Error while deleting user ->", err);
      res.status(500).json({ error: "Failed to delete user" });
    });
};

module.exports = {
  getAllUsers,
  getOneUser,
  createNewUser,
  updateUser,
  deleteUser,
};
