# Documentation

## Installation

Install the package via github.

```bash
# npm
npm install https://github.com/capy-pl/express-rate-limit.git

#yarn
yarn add https://github.com/capy-pl/express-rate-limit.git
```

## Usage

```javascript
import RateLimit from "express-rate-limit";
import express from "express";

const app = express();

app.use(RateLimit());
```

The middleware will write following headers to the response:

- X-Rate-Limit-Reset: How many seconds remain before current time window ends.
- X-Rate-Limit-Remaining: How many available requests that user can make in current time window.

If the application were to make more requests than allowed, it will receive a http status 429 code.

## Options

```javascript
RateLimit(options);
```

You can provide options to the middleware by passing an object.

- timeWindow: A time period that user can only make at most n request(in second). (1 hour by default)
- rateLimit: Number of request a user can only make in a single period. (1000 by default)

## Example

User can only make 100 requests per 60 seconds.

```javascript
RateLimit({
  timeWindow: 60,
  rateLimit: 100
});
```
