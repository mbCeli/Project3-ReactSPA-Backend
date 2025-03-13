const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");

// bring in the middlewares to check if the user is authenticated, admin or user
const { isAuthenticated, isAdmin, isUserOrAdmin } = require("../middleware/jwt.middleware");

router.get("/", isAuthenticated, isAdmin, userController.getAllUsers);
router.get("/:userId", isAuthenticated, isUserOrAdmin, userController.getOneUser);
router.post("/", userController.createNewUser);
router.put("/:userId", isAuthenticated, isUserOrAdmin, userController.updateUser);
router.delete("/:userId", isAuthenticated, isUserOrAdmin, userController.deleteUser);

router.get("/:userId/profile", userController.getUserProfile);

module.exports = router;
