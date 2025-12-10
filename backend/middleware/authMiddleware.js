const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    const token = req.cookies && req.cookies.token;
    if (!token) return res.status(401).json({ msg: 'No token found in cookies, authorization denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        if (req.user.isLocked) return res.status(403).json({ msg: 'Account is locked. Please contact support.' });
        next();
    } catch (err) {
        res.clearCookie('token');
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
