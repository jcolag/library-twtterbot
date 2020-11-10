const fs = require('fs');
const twit = require('twit');
const winston = require('winston');

const config = JSON.parse(fs.readFileSync('config.json'));
const ids = JSON.parse(fs.readFileSync('processed_ids.json'));
const library = JSON.parse(fs.readFileSync('urls.json'));
const twitter = new twit(config);
const stream = twitter.stream(
  'statuses/filter',
  { follow: [ config.user_id ] }
);
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: config.screen_name },
  transports: [
    new winston.transports.File({ filename: `${config.screen_name}` })
  ],
});

library.forEach((item) => {
  const keywords = item.keywords
    .join(' ')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .split(' ');

  // Combine the original keywords and normalized keywords into a
  // single array with no duplicates
  item.keywords = [...new Set([...item.keywords, ...keywords])]
});

stream.on('tweet', (tweet) => {
  const id = tweet.id_str;
  const text = tweet.text;
  const whoFrom = tweet.user.screen_name;
  // Skip everything before the bot is called
  const start = text.indexOf(`@${config.screen_name}`) +
    config.screen_name.length + 1;
  // Normalize the keywords as lowercase letters with no diacritical marks
  const keywords = text
    .slice(start)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, ' ');
  const urls = getUrlsForKeywords(keywords.split(' '));
  let status;

  if (ids.indexOf(id) >= 0) {
    // We've already seen this tweet
    return;
  }

  // Record the tweet of the ID we're seeing, so that we can skip it
  // in the future
  logger.log('debug', JSON.stringify(tweet, ' ', 2));
  ids.push(id);
  fs.writeFileSync('processed_ids.json', JSON.stringify(ids, ' ', 2));

  // If there were responses and none of them were URLs, just treat the
  // response like a message; this allows for custom responses, like replying
  // coherently to someone thanking the bot
  if (urls.join(' ').indexOf('http') < 0) {
    status = urls.join(' ');
  }

  // The bot should never reply to itself
  if (whoFrom === config.screen_name) {
    return;
  }

  if (urls.length > 0) {
    const base = "Here's what I found for ";
    const more = ' and 00 more';
    const extra = 0;

    status = `${base}${keywords.trim()}: ${urls.join(' ')}`;
    while (status.replace(/(?:https?):\/\/[\n\S]+/g, '').length > 280) {
      // In the unlikely event that the message doesn't fit into Twitter's
      // character limit, the only reasonable thing to do is to trim URLs
      // until it does fit, even though that doesn't reclaim much space
      extra += 1;
      urls.pop();
      const end = more.replace('00', extra);
      status = `${base}${keywords.trim()}: ${urls.join(' ')}${more}`;
    }
  } else {
    status = `Sorry, I couldn't find anything on ${keywords.trim()}.`;
  }

  twitter.post(
    'statuses/update',
    {
      // Maybe this is overkill, but we need Twitter to recognize this
      // as a reply to the user and inbound tweet, so better to specify
      // too much than too little.
      in_reply_to_screen_name: whoFrom,
      in_reply_to_status_id: tweet.id,
      in_reply_to_status_id: tweet.id_str,
      in_reply_to_user_id: tweet.user.id,
      in_reply_to_user_id_str: tweet.user.id_str,
      status: `@${whoFrom} ${status}`,
    },
    (err, data, response) => {
      if (err) {
        logger.error("Couldn't tweet:");
        logger.error(JSON.stringify(err, ' ', 2));
      }
    });
});
stream.on('error', (error) => {
  logger.error(JSON.stringify(error, ' ', 2));
});

function getUrlsForKeywords(keywords) {
  const urls = [];

  for (let i = 0; i < library.length; i++) {
    const choice = library[i];

    for (let j = 0; j < keywords.length; j++) {
      if (keywords[j].length > 0 && choice.keywords.indexOf(keywords[j]) >= 0) {
        urls.push(choice.url);
      }
    }
  }

  return [...new Set(urls)];
}
