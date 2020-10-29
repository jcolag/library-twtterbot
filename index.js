const fs = require('fs');
const twit = require('twit');

const config = JSON.parse(fs.readFileSync('config.json'));
const ids = JSON.parse(fs.readFileSync('processed_ids.json));
const library = JSON.parse(fs.readFileSync('urls.json'));
const twitter = new twit(config);
const stream = twitter.stream(
  'statuses/filter',
  { follow: [ config.user_id ] }
);

stream.on('tweet', (tweet) => {
  const id = tweet.id_str;
  const text = tweet.text;
  const whoFrom = tweet.user.screen_name;
  const start = text.indexOf(`@${config.screen_name}`) +
    config.screen_name.length + 1;
  const keywords = text.slice(start);
  const urls = getUrlsForKeywords(keywords.split(' '));
  let status;

  ids.push(id);
  fs.writeFileSync('processed_ids.json', JSON.stringify(ids, ' ', 2));

  if (urls.indexOf('http') < 0) {
    status = urls;
  } else if (whoFrom === config.screen_name) {
    return;
  }

  if (urls.length > 0) {
    const base = "Here's what I found for ";
    const more = ' and 00 more';
    const extra = 0;

    status = `${base}${keywords.trim()}: ${urls}`;
    while (status.replaceAll(/(?:https?):\/\/[\n\S]+/g, '').length > 280) {
      extra += 1;
      urls.pop();
      const end = more.replace('00', extra);
      status = `${base}${keywords.trim()}: ${urls}${more}`;
    }
  } else {
    status = `Sorry, I couldn't find anything on ${keywords.trim()}.`;
  }

  twitter.post(
    'statuses/update',
    {
      in_reply_to_screen_name: whoFrom,
      in_reply_to_status_id: tweet.id,
      in_reply_to_status_id: tweet.id_str,
      in_reply_to_user_id: tweet.user.id,
      in_reply_to_user_id_str: tweet.user.id_str,
      status: `@${whoFrom} ${status}`,
    },
    (err, data, response) => {
      if (err) {
        console.log("Couldn't tweet:");
        console.log(JSON.stringify(err, ' ', 2));
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
