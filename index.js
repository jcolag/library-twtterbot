const fs = require('fs');
const twit = require('twit');

const configFile = fs.readFileSync('config.json');
const config = JSON.parse(configFile);
const twitter = new twit(config);

twitter.post(
  'statuses/update',
  {
    status: "Test post; please ignore."
  },
  (err, data, response) => {
    if (err) {
      console.log("Couldn't tweet: ", err);
    }
  });

