const { expressjwt: jwt } = require("express-jwt");
const User = require("../models/User.model");

// Instantiate the JWT token validation middleware
const isAuthenticated = jwt({
  secret: process.env.TOKEN_SECRET,
  algorithms: ["HS256"],
  requestProperty: "payload",
  getToken: getTokenFromHeaders,
});

// Function used to extract the JWT token from the request's 'Authorization' Headers
function getTokenFromHeaders(req) {
  // Check if the token is available on the request Headers
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    // Get the encoded token string and return it
    const token = req.headers.authorization.split(" ")[1];
    return token;
  }

  return null;
}

// to check if the user authenticated is admin
const isAdmin = (req, res, next) => {
  if(!req.payload.isAdmin) {
    return res.status(403).json({ message: "Admin access required" });
  }
  next()
};

// to check if the user authenticated is admin or the account user
const isUserOrAdmin = (req, res, next) => {
  // this will allow the access to the admi
  if (req.payload.isAdmin) {
    return next();
  }

  // This will allow access if the user is accessing their own data
  const requestedUserId = req.params.userId;

  if (req.payload._id === requestedUserId) { // if the request is coming from the same user then next
    return next();
  }
  return res.status(403).json({ message: "Unauthorized access" }); // if not then return error
};


module.exports = {
  isAuthenticated,
  isAdmin,
  isUserOrAdmin
};
