import axios from "axios";
import { Agent as httpAgent } from "http";
import { Agent as httpsAgent } from "https";

const MAX_DELAY = 2_147_483_647;
export const PROXY_INSTANCE = axios.create({
  timeout: MAX_DELAY,
  httpAgent: new httpAgent({ keepAlive: true, keepAliveMsecs: 10e8 }),
  httpsAgent: new httpsAgent({ keepAlive: true, keepAliveMsecs: 10e8 }),
});
