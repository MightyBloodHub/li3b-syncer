const puppeteer = require('puppeteer');
const express = require('express');
const app = express();
const port = 3000;

app.get('/fetch-venue-data', async (req, res) => {
  const venue_code = req.query.venue_code;
  const venue_date = req.query.venue_date;

  if (!venue_code || !venue_date) {
    return res.status(400).send({ error: 'Both venue_code and venue_date are required.' });
  }

  const your_url = `https://www.li3ib.com/en-kw/venues/${venue_code}?date=${venue_date}`;
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36');
  await page.setViewport({ width: 1280, height: 800 });

  await page.goto(your_url, { waitUntil: 'networkidle0' });

  try {
    await page.waitForSelector('.venue__timeslot', { timeout: 10000 });
  } catch (error) {
    console.log('Failed to find the elements:', error);
    await browser.close();
    return res.status(500).send({ error: 'Failed to find the elements.' });
  }

  const elements = await page.$$('.venue__timeslot');
  const results = [];

  for (const element of elements) {
    const elementData = await element.evaluate(el => {
      const attributes = {};
      for (const attr of el.attributes) {
        attributes[attr.name] = attr.value;
      }
      return { content: el.textContent, attributes: attributes };
    });
    results.push(elementData);
  }

  await browser.close();
  res.send(results);
});

app.listen(port, () => {
  console.log(`API listening at http://localhost:${port}`);
});
