var express = require('express');
var router = express.Router();
const axios = require('axios');


router.get('/', function (req, res, next) {
  res.send('respond with a resource');
});



router.post('/login', function (req, res, next) {
  const { user, password } = req.body;

  if (!user || !password) {
    return res.status(400).send('Missing ID or password');
  }

  axios.post('login', { id, password })
    .then(loginResponse => {
      const token = loginResponse.data.token;
      return axios.post('verify', { token });
    })
    .then(verifyResponse => {
      const userData = verifyResponse.data;
      res.json({ token, user: userData });
    })
    .catch(error => {
      if (error.response) {
        if (error.response.status === 401) {
          return res.status(401).send('Incorrect ID or password');
        } else {
          return res.status(error.response.status).send(error.response.data.message);
        }
      } else if (error.request) {
        return res.status(500).send('No response received from the authentication server');
      } else {
        return res.status(500).send('Error connecting to the authentication server');
      }
    });
});


router.post('/verify', function (req, res, next) {
  const token = req.headers.authorization;

  if (!token) {
    return res.status(400).send('Missing token');
  }

  axios.post(`verify`, { token })
    .then(response => {
      const user = response.data;
      res.json({ user });
    })
    .catch(error => {
      if (error.response) {
        return res.status(error.response.status).send(error.response.data.message);
      } else if (error.request) {
        return res.status(500).send('No response received from the authentication server');
      } else {
        return res.status(500).send('Error connecting to the authentication server');
      }
    });
});

module.exports = router;
