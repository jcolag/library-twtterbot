const fs = require('fs');
const twit = require('twit');

const configFile = fs.readFileSync('config.json');
const config = JSON.parse(configFile);
const twitter = new twit(config);

const stream = twitter.stream(
  'statuses/filter',
  { follow: [ config.user_id ] }
);

stream.on('tweet', (tweet) => {
  console.log(JSON.stringify(tweet, ' ', 2));
});
stream.on('error', (error) => {
  console.log(JSON.stringify(error, ' ', 2));
});

