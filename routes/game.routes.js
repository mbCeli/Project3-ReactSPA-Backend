const express = require("express");
const router = express.Router();
gameController = require("../controllers/game.controller");

// bring in the middlewares to check if the user is authenticated, admin or user
const { isAuthenticated, isAdmin } = require("../middleware/jwt.middleware");

router.get("/", isAuthenticated, gameController.getAllGames);
router.get("/:gameId", isAuthenticated, gameController.getOneGame);
router.post("/", isAuthenticated, isAdmin, gameController.createNewGame);
router.put("/:gameId", isAuthenticated, isAdmin, gameController.updateGame);
router.delete("/:gameId", isAuthenticated, isAdmin, gameController.deleteGame);

module.exports = router;