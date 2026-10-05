const jwt = require("jsonwebtoken");
function verifyToken(req,res,next){
    const authHeader = req.headers.Authorization||req.headers.authorization;
    if(!authHeader)
        return res.status(401).json({msg:"Header is not defined!"});
    let token = authHeader.split(' ')[1];
    if (!token) {
      return res
        .status(401)
        .json({ msg: "Tokens are not generated!Access denied" });
    }
    try{
        const decodedToken = jwt.verify(token,process.env.JWT_SECRET);
        req.user = decodedToken;
        next();
    }
    catch(err){
        res.status(401).json({msg:"Invalid Token"});
    }
}
module.exports = {verifyToken};