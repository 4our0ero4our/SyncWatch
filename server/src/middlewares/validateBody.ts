import { Request, Response, NextFunction } from "express";
import Joi from "joi";
import { StatusCodes } from "http-status-codes";

export function validateBody<T>(schema: Joi.ObjectSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const details = error.details.map((d) => ({ path: d.path.join("."), message: d.message }));
      res.status(StatusCodes.BAD_REQUEST).json({ error: "Validation failed", details });
      return;
    }
    req.body = value;
    next();
  };
}
