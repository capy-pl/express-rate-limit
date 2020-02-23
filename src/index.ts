import express from "express";

type Record = {
  rateLimitRemain: number;
  rateLimitReset: number;
};

type RecordTable = { [key: string]: Record };

type Config = {
  timeWindow: number; // in seconds.
  rateLimit: number;
};

export default function RateLimit(config?: Config) {
  const recordTable: RecordTable = {};
  // Rate limit is set to 1000 by default.
  const limit = (config && config.rateLimit) || 1000;
  // Time window is set to 1 hour by default.
  const timeWindow =
    config && config.timeWindow ? config.timeWindow * 1000 : 60 * 60 * 1000;
  return function(
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) {
    try {
      const { ip } = req;

      if (ip in recordTable) {
        const { rateLimitRemain, rateLimitReset } = recordTable[ip];

        // If previous reset time was passed, reset the record.
        if (rateLimitReset < new Date().getTime()) {
          recordTable[ip] = {
            rateLimitRemain: limit - 1,
            rateLimitReset: new Date().getTime() + timeWindow
          };
          res.setHeader("X-RateLimit-Remaining", limit - 1);
          res.setHeader("X-RateLimit-Reset", Math.ceil(timeWindow / 1000));
        } else {
          // If the rate limit is equal or smaller than zero, return http 429 code.
          if (rateLimitRemain <= 0) {
            res.setHeader("X-RateLimit-Remaining", 0);
            res.setHeader(
              "X-RateLimit-Reset",
              Math.ceil((rateLimitRemain - new Date().getTime()) / 1000)
            );
            res.status(429).end();
            return;
          } else {
            recordTable[ip].rateLimitRemain -= 1;
            res.setHeader(
              "X-RateLimit-Remaining",
              recordTable[ip].rateLimitRemain
            );
            res.setHeader(
              "X-RateLimit-Reset",
              Math.ceil((rateLimitRemain - new Date().getTime()) / 1000)
            );
          }
        }
      } else {
        recordTable[ip] = {
          rateLimitRemain: limit - 1,
          rateLimitReset: new Date().getTime() + timeWindow
        };
        res.setHeader("X-RateLimit-Remaining", limit - 1);
        res.setHeader("X-RateLimit-Reset", Math.ceil(timeWindow) / 1000);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
