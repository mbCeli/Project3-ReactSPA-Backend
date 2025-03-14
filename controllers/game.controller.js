const Game = require("../models/Game.model");

//GET all games
const getAllGames = (req, res) => {
  Game.find({})
    .then((games) => {
      res.status(200).json(games);
    })
    .catch((err) => {
      res.status(500).json({ error: "Failed to retrieve games: " + err });
    });
};

//GET one game
const getOneGame = (req, res) => {
  const { gameId } = req.params; //we are doing a request to the parameters of the "model" specifically to the game Id

  Game.findById(gameId)
    .then((game) => {
      res.status(200).json(game);
    })
    .catch((err) => {
      res.status(500).json({ error: "Failed to retrieve game: " + err });
    });
};

//POST new game
const createNewGame = (req, res) => {
  Game.create(req.body)
    .then((createGame) => {
      res.status(201).json(createGame);
    })
    .catch((err) => {
      res.status(500).json({ error: "Failed to create new game: " + err });
    });
};

//PUT to update a game
const updateGame = (req, res) => {
  const { gameId } = req.params;

  Game.findByIdAndUpdate(gameId, req.body, { new: true })
    .then((updateGame) => {
      if (!updateGame) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.status(204).json(updateGame);
    })
    .catch((err) => {    
      res.status(500).json({ error: "Failed to update game: " + err });
    });
};

//DELETE a game
const deleteGame = (req, res) => {
  const { gameId } = req.params;

  Game.findByIdAndDelete(gameId)
    .then((deleteGame) => {
      if (!deleteGame) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.status(204).send();
    })
    .catch((err) => {
      res.status(500).json({ error: "Failed to delete game: " + err });
    });
  };

module.exports = {
  getAllGames,
  getOneGame,
  createNewGame,
  updateGame,
  deleteGame,   
};
