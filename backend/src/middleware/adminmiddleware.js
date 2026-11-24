const jwt = require('jsonwebtoken');
require('dotenv').config();
function adminMiddleware(req, res, next) {
  const token = req.headers.token;
  const decode = jwt.verify(token, process.env.JWT_AUTH_PASSWORD);
  if (decode && decode.role == 'ADMIN') {
    req.userId = decode;
    req.adminRole=decode.role;
    next();
  } else {
    return res.status(404).json({
      message: 'You are not ADMIN',
    });
  }
}

module.exports = {
  adminMiddleware: adminMiddleware,
};
