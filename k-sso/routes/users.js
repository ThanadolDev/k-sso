var express = require("express");
var router = express.Router();
const axios = require("axios");
var passport = require("passport");
const crypto = require("crypto");
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { Strategy: BearerStrategy } = require('passport-http-bearer');
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
router.use(bodyParser.json());

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: 'your_secret_key'
};
router.get("/", function (req, res, next) {
  res.send("respond with a resource");
});

passport.use(new JwtStrategy(jwtOptions, function(jwtPayload, done) {
  // Extract user information from the JWT payload
  const user = jwtPayload; // Assuming jwtPayload contains the user information

  // Pass user object to the next middleware or route handler along with JWT payload
  done(null, { user, jwtPayload });
}));


router.post("/login", function (req, res) {
  console.log(req.body);
  const { usr, pwd } = req.body;
  if (!usr || !pwd) {
    return res.status(400).send("Missing ID or password");
  }
  axios
    .post("https://api.nitisakc.dev/auth/login", req.body)
    .then(async (loginResponse) => {
      const token = loginResponse.data.accessToken;
      console.log(token);
      // Verify the token
      const verifyResponse = await axios.post(
        "https://api.nitisakc.dev/auth/verify",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      console.log(verifyResponse.data);
      const sessionToken = generateSessionToken(verifyResponse.data);
      res.json(sessionToken);
    })
    
    // .then((verifyResponse) => {
    //   const userData = verifyResponse;
    //   console.log(userData)
    //   // const sessionToken = generateSessionToken(userData);
    //   // res.json({ res });
    // })
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


router.get('/auth', passport.authenticate('jwt', { session: false }), function(req, res) {
  const { jwtPayload } = req.user;
  res.json({ jwtPayload });
});

function generateSessionToken(userData) {
  const dataString = userData;
 console.log(dataString)
  const sessionToken = jwt.sign(dataString, "your_secret_key");

  return sessionToken;
}

router.post("/verify", function (req, res) {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(400).send("Missing token");
  }
  axios.post(
    "https://api.nitisakc.dev/auth/verify",
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )
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
