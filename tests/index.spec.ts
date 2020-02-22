import { RateLimit } from "../src";
import express from "express";
import request from "supertest";

const handler = (req: express.Request, res: express.Response) => {
  return res.status(200).end();
};

const sleep = (n: number) => {
  return new Promise<void>((resolve, reject) => {
    setTimeout(resolve, n * 1000);
  });
};

describe("RateLimit", () => {
  const rateLimit = 20;
  const timeWindow = 1;

  test("It should return a middleware function.", () => {
    const middleware = RateLimit();
    expect(middleware).toBeDefined();
    expect(typeof middleware).toBe("function");
  });

  test("It should write headers to response.", async () => {
    const app = express();
    const middleware = RateLimit({
      rateLimit,
      timeWindow
    });

    app.use(middleware);
    app.get("*", handler);

    const res = await request(app).get("/");

    expect(res.status).toBe(200);
    expect(res.header["x-ratelimit-remaining"]).toBeDefined();
    expect(parseInt(res.header["x-ratelimit-remaining"])).toBe(rateLimit - 1);

    expect(res.header["x-ratelimit-reset"]).toBeDefined();
    expect(parseInt(res.header["x-ratelimit-reset"])).toBe(timeWindow);
  });

  test("It should reduce the rate limit.", async () => {
    const app = express();

    // User can only access the server once every 5 seconds.
    app.use(
      RateLimit({
        rateLimit,
        timeWindow
      })
    );

    app.get("*", handler);

    const agent = request.agent(app);
    const res1 = await agent.get("/");

    expect(parseInt(res1.header["x-ratelimit-remaining"])).toBe(rateLimit - 1);

    const res2 = await agent.get("/");
    expect(parseInt(res2.header["x-ratelimit-remaining"])).toBe(rateLimit - 2);
  });

  test("It should return a http 429 status code when exceeding rate limit.", async () => {
    const app = express();

    // User can only access the server once every 5 seconds.
    app.use(
      RateLimit({
        rateLimit: 1,
        timeWindow
      })
    );

    app.get("*", handler);

    const agent = request.agent(app);
    await agent.get("/");

    const res = await agent.get("/");
    expect(res.status).toBe(429);
    expect(parseInt(res.header["x-ratelimit-remaining"])).toBe(0);
  });

  test("It should refresh the limit every n seconds.", async () => {
    const app = express();

    app.use(
      RateLimit({
        rateLimit,
        timeWindow: 3
      })
    );

    app.get("*", handler);

    const agent = request.agent(app);

    await agent.get("/");
    await agent.get("/");
    await agent.get("/");

    const resBefore = await agent.get("/");
    expect(parseInt(resBefore.header["x-ratelimit-remaining"])).toBe(
      rateLimit - 4
    );

    await sleep(3);

    const resAfter = await agent.get("/");
    expect(resAfter.status).toBe(200);
    expect(parseInt(resAfter.header["x-ratelimit-remaining"])).toBe(
      rateLimit - 1
    );
  });
});
