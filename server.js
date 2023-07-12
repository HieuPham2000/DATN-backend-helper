require("dotenv").config();
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const cool = require('cool-ascii-faces');
const Gtts = require("gtts");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Verify request
const CORE_APP_KEY = process.env.CORE_APP_KEY || "";
const AUTH_KEY = "hust-helper-app-key";
app.use((req, res, next) => {
  if(CORE_APP_KEY && req.headers[AUTH_KEY] != CORE_APP_KEY) {
    return res.status(403).json();
  }
  next();
});

// ===================================================================================================
// ============================================= API test connection =================================
// ===================================================================================================
app.get('/', function (req, res) {
  res.send(cool())
});

// ===================================================================================================
// ============================================= API text to speech ==================================
// ===================================================================================================

app.post('/tts', async (req, res) => {
  const gtts = new Gtts(req.body.text, req.body.lang || "en");
  res.set({'Content-Type': 'audio/mp3'});
  gtts.stream().pipe(res);
  // let stream = gtts.stream();
  // let data = await streamToBase64(stream);
  // res.json({b64Data: data});
});

app.get('/tts', (req, res) => {
  const gtts = new Gtts(req.query.text, req.query.lang || "en");
  res.set({'Content-Type': 'audio/mp3'});
  gtts.stream().pipe(res);
});

// ===================================================================================================
// ============================================= API translate =======================================
// ===================================================================================================
const rateLimit = require('express-rate-limit');
const transApi = require('@vitalets/google-translate-api');
// const httpProxy = require('http-proxy-agent');
// const agent = new httpProxy.HttpProxyAgent('http://46.41.141.111');

const apiLimiter = rateLimit({
	windowMs: 60 * 1000,
	max: 6, // Limit each IP 
  message: 'Too many accounts created from this IP, please try again after a minute',
	standardHeaders: true,
	legacyHeaders: false, 
});

app.get('/translate/test', apiLimiter, async (req, res) => {
  try {
    const { text } = await transApi.translate(req.query.text, {
      to: req.query.to || 'vi',
      from: req.query.from || 'en', // có thể để 'auto'
      // fetchOptions: { agent },
    });
    return res.send(text)
  } catch (e) {
    if (e.name === 'TooManyRequestsError') {
      // retry with another proxy agent
    }
    console.error(e);
    return res.status(500).json();
  } 
});


app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
