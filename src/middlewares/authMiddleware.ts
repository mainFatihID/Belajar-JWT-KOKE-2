import type { NextFunction, Request, Response } from "express";
import jwt from 'jsonwebtoken'

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    if (!req.headers?.authorization) {
        res.status(403).json({
            message : 'Not login yet'
        })
    }

    const token : any = req.headers.authorization?.split(" ")[1]

    if (!token) {
        return res.status(401).json({
            message : 'Wrong token format'
        })
    }

    try {
        const decoded = jwt.verify(token, 'super-secret')

        return next()
    } catch (error) {
        return res.status(403).json({
            message : 'Invalid token'
        })   
    }
}