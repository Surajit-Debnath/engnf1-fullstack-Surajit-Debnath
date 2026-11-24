const jwt = require('jsonwebtoken');
require('dotenv').config();
function authMiddleware(req, res, next) {
  const token = req.headers.token;
  const decode = jwt.verify(token, process.env.JWT_AUTH_PASSWORD);
  if (decode) {
    req.userId = decode;
    req.userRole=decode.role;
    next();
  } else {
    return res.status(403).json({
      message: 'You are not signed in',
    });
  }
}

module.exports = {
  authMiddleware: authMiddleware,
};
