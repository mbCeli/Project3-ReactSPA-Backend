const { GoogleGenerativeAI } = require("@google/generative-ai");
const Game = require("../models/Game.model");
const User = require("../models/User.model");
const PlayAnalytics = require("../models/PlayAnalytics.model");
const Rating = require("../models/Rating.model");
const { validationResult } = require("express-validator");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const getGameRecommendations = async (userId) => {
  try {
    // Get user favorite games
    const user = await User.findById(userId).populate("favourites");

    // Get user play history
    const playHistory = await PlayAnalytics.find({
      user: userId,
      userAction: "play",
    }).populate("game");

    const ratings = await Rating.find({
      user: userId,
    }).populate("game");

    // Get all games
    const allGames = await Game.find().select(
      "title category difficulty description"
    );

    return {
      user,
      favouriteGames: user.favourites || [],
      playedGames: playHistory.map((session) => session.game).filter(Boolean),
      ratedGames: ratings.map((rating) => rating.game).filter(Boolean),
      allGames,
    };
  } catch (error) {
    console.error("Error fetching game recommendations:", error);
    return null;
  }
};

// Chat with the AI
const chatWithAssistant = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        message: "Validation error",
        errors: errors.array(),
      });
    }

    const { message } = req.body;
    const userId = req.payload._id;

    if (!message) {
      return res.status(400).json({ message: "Message is required" });
    }

    // Get user and game data for recommendations
    const userGameData = await getGameRecommendations(userId);

    if (!userGameData) {
      return res
        .status(500)
        .json({ message: "Failed to retrieve user game data" });
    }

    // Create a system prompt with user context
    let systemPrompt = `You are a smart and helpful gaming assistant for a web platform called "Game Hub". Your role is to provide game recommendations, tips, and answer questions about games on the platform.

Current user information:
- Username: ${userGameData.user.username || "Unknown"}
- Games played count: ${userGameData.user.stats?.gamesPlayed || 0}
- Favorite games: ${
      userGameData.favouriteGames.map((game) => game.title).join(", ") ||
      "None yet"
    }
- Recently played: ${
      userGameData.playedGames
        .slice(0, 5)
        .map((game) => game.title)
        .join(", ") || "None yet"
    }

Games available on the platform (sample):
${userGameData.allGames
  .slice(0, 10)
  .map((game) => `- ${game.title} (${game.category}, ${game.difficulty})`)
  .join("\n")}

Your task is to:
1. Respond in a friendly, conversational, and enthusiastic tone
2. Provide helpful recommendations based on the user's preferences
3. Answer questions about specific games if asked
4. Suggest games the user might enjoy based on their history
5. Keep responses concise (maximum 3-4 sentences)

Only recommend games from the available list. If you don't have enough information, ask follow-up questions to better understand user preferences.

USER QUERY: ${message}`;

    // Create a generative model with Gemini 2.0 Flash
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Generate content
    const result = await model.generateContent(systemPrompt);
    const response = result.response.text();

    // Log the interaction
    console.log(`User query: ${message}`);
    console.log(`AI response: ${response.substring(0, 100)}...`);

    return res.status(200).json({ response });
  } catch (error) {
    console.error("AI Assistant error:", error);
    return res.status(500).json({
      message: "Error processing your request",
      error: error.message,
    });
  }
};

module.exports = {
  chatWithAssistant,
};
