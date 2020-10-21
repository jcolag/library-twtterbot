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
});
stream.on('error', (error) => {
  console.log(JSON.stringify(error, ' ', 2));
});

function getUrlsForKeywords(keywords) {
  const urls = [];

  for (let i = 0; i < library.length; i++) {
    const choice = library[i];

    for (let j = 0; j < keywords.length; j++) {
      if (choice.keywords.indexOf(keywords[j]) >= 0) {
        urls.push(choice.url);
      }
    }
  }

  return [...new Set(urls)].join(' ');
}
