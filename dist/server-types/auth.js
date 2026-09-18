"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireApiAuth = void 0;
exports.getVerifiedIdentity = getVerifiedIdentity;
const express_1 = require("@clerk/express");
function getVerifiedIdentity(auth) {
    if (!auth.userId)
        return null;
    return {
        userId: auth.userId,
        sessionId: auth.sessionId || null,
    };
}
const requireApiAuth = (req, res, next) => {
    const identity = getVerifiedIdentity((0, express_1.getAuth)(req));
    if (!identity) {
        res.status(401).json({
            error: {
                code: 'unauthorized',
                message: 'Authentication is required to access this resource.',
            },
        });
        return;
    }
    res.locals.auth = identity;
    next();
};
exports.requireApiAuth = requireApiAuth;
