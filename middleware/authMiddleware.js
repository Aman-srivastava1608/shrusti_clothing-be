const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  const header = req.header('Authorization');
  if (!header) return res.status(401).json({message:'Access denied'});
  const token = header.replace('Bearer ', '');
  try{
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretKey123');
    req.user = decoded; // { user_id, branch_id?, role }
    next();
  }catch(e){
    return res.status(401).json({message:'Invalid token'});
  }
}
