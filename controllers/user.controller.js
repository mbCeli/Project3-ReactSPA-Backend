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
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Create a copy of req.body to avoid modifying the original
    const updateData = { ...req.body };

    // If updating password, hash it
    if (updateData.password) {
      const salt = await bcrypt.genSalt(saltRounds);
      updateData.password = await bcrypt.hash(updateData.password, salt);
    }

    // Process profile picture if included
    if (req.file) {
      // Assuming you're using multer or another middleware to handle file uploads
      updateData.profilePicture = req.file.path || req.file.location; // Use path for local storage or location for S3
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
      runValidators: true, // Run model validators
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Updated user ->", updatedUser);
    res.status(200).json(updatedUser);
  } catch (err) {
    console.error("Error updating user:", err);
    res.status(500).json({ error: "Failed to update user: " + err.message });
  }
};
/* 
ORIGINAL
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
*/

//DELETE user
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

// For the user para que pueda editar su perfil
// GET user profile (public profile data - excludes sensitive info)
const getUserProfile = (req, res) => {
  const { userId } = req.params;
  
  User.findById(userId)
    .select('-password -__v') // Exclude sensitive fields
    .then((user) => {
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.status(200).json(user);
    })
    .catch((err) => {
      console.error("Error retrieving user profile:", err);
      res.status(500).json({ error: "Failed to retrieve user profile" });
    });
};

module.exports = {
  getAllUsers,
  getOneUser,
  createNewUser,
  updateUser,
  deleteUser,
  getUserProfile,
};
