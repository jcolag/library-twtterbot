const fs = require('fs');
const twit = require('twit');

const config = JSON.parse(fs.readFileSync('config.json'));
const library = JSON.parse(fs.readFileSync('urls.json'));
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

