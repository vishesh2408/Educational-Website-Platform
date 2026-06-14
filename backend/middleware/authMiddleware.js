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
        const isProd = process.env.NODE_ENV === 'production';
        res.clearCookie('token', { 
            httpOnly: true, 
            secure: isProd, 
            sameSite: isProd ? 'None' : 'Lax' 
        });
        res.status(401).json({ msg: 'Token is not valid' });
    }
};
