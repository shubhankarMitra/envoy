import express, { json } from 'express';
import 'dotenv/config.js';
import cors from 'cors';
import morgan from 'morgan';
import { getCircularReplacer } from './utils.js';
import curlirize from 'axios-curlirize';
import { PROXY_INSTANCE } from './axios.config.js';
import httpProxy from 'http-proxy';
import { exec } from 'child_process';
import * as util from 'util';
import { writeFileSync } from 'fs';

const PORT = process.env.PORT || '5000';
const promisifiedExec = util.promisify(exec);

curlirize(PROXY_INSTANCE);

const app = express();

app.set('trust proxy', true);

//Middleware
app.use(cors());
app.use(json());
app.use(morgan('combined'));

app.use('/apg', async (req, res, next) => {
  const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

  const completePayLoad = {
    ...req.body,
    headers: {}, //provide headers
  };
  try {
    const data = await PROXY_INSTANCE(completePayLoad);

    const response = JSON.parse(JSON.stringify(data, getCircularReplacer()));

    res.status(200).json(response);
  } catch (error) {
    if (error?.config?.curlCommand) {
      try {
        //running curl to fetch the data again in case http library fails,in this case axios.
        /**
         * A desirable approach would be to use Node native Fetch API instead of axios
         */
        const data = await promisifiedExec(error.config.curlCommand);
        const curlResp = JSON?.parse(data.stdout) || null;

        if (curlResp) {
          res.status(200).json(curlResp?.data || curlResp);
          return;
        }
      } catch (error) {
        console.log('error =>', error);
        writeFileSync('error.json', JSON.stringify(error));
      }
    }

    // Returning errors if everything fails
    const response = JSON.parse(JSON.stringify(error, getCircularReplacer()));

    const error_response = Object.assign(
      { aggregate: error.errors || [], isAggregate: !!error.errors },
      error?.response?.data ?? response
    );
    res
      .status(error?.response?.status || 500)
      .json({ curl: error.config.curlCommand, ok: false, ...error_response });
  }
});

//Boot the app
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:5000`);
});
