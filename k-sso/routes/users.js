var express = require("express");
var router = express.Router();
const axios = require("axios");
var passport = require("passport");
const crypto = require('crypto');
var Strategy = require("passport-http-bearer").Strategy;
const bodyParser = require("body-parser");
router.use(bodyParser.json());

router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

passport.use(
  new Strategy(function (token, done) {
    // axios.post('https://api.nitisakc.dev/auth/verify', { token })
    //   .then(response => {
    //     const user = response.data;
    //     done(null, user);
    //   })
    //   .catch(error => {
    //     done(error);
    //   });
  })
);

router.post("/login", function (req, res) {
  console.log(req.body);
  const { user, password } = req.body;
  if (!user || !password) {
    return res.status(400).send("Missing ID or password");
  }
  axios
    .post("https://api.nitisakc.dev/auth/login", { user, password })
    .then((loginResponse) => {
      const token = loginResponse.data.token;
      return axios.post("https://api.nitisakc.dev/auth/verify", { token });
    })
    .then((verifyResponse) => {
      const userData = verifyResponse.data;
      const sessionToken = generateSessionToken(userData);
      res.json({ sessionToken });
    })
    .catch((error) => {
      if (error.response) {
        if (error.response.status === 401) {
          return res.status(401).send("Incorrect ID or password");
        } else {
          return res
            .status(error.response.status)
            .send(error.response.data.message);
        }
      } else if (error.request) {
        return res
          .status(500)
          .send("No response received from the authentication server");
      } else {
        return res
          .status(500)
          .send("Error connecting to the authentication server");
      }
    });
});

router.get("/auth",function (req, res) {
  passport.authenticate('bearer', { session: false });
  res.send('Authenticated');
})

function generateSessionToken(userData) {
  const dataString = JSON.stringify(userData);

  const hash = crypto.createHash('sha256');
  hash.update(dataString);

  const sessionToken = hash.digest('hex');

  return sessionToken;
}

router.post("/verify", function (req, res) {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(400).send("Missing token");
  }
  axios
    .post(`https://api.nitisakc.dev/auth/verify`, { token })
    .then((response) => {
      const user = response.data;
      res.json({ user });
    })
    .catch((error) => {
      if (error.response) {
        return res
          .status(error.response.status)
          .send(error.response.data.message);
      } else if (error.request) {
        return res
          .status(500)
          .send("No response received from the authentication server");
      } else {
        return res
          .status(500)
          .send("Error connecting to the authentication server");
      }
    });
});


module.exports = router;
