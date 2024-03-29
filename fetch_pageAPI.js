const puppeteer = require('puppeteer');
const express = require('express');
const app = express();
// ...
const port = process.env.PORT || 3000;

function isTimeslotAvailable(data, timeSlot) {
  const targetSlot = data.find(slot => slot.content === timeSlot);
  if (targetSlot) {
    return targetSlot.attributes.disabled === undefined;
  }
  return false;
}

app.get('/fetch-venue-data', async (req, res) => {
  const venue_code = req.query.venue_code;
  const venue_date = req.query.venue_date;

  if (!venue_code || !venue_date) {
    return res.status(400).send({ error: 'Both venue_code and venue_date are required.' });
  }

  const elementsData = await getVenueData(venue_code, venue_date);
  res.send(elementsData);
});

app.get('/is-timeslot-available', async (req, res) => {
  const venue_code = req.query.venue_code;
  const venue_date = req.query.venue_date;
  const timeSlot = req.query.timeSlot;

  if (!venue_code || !venue_date || !timeSlot) {
    return res.status(400).send({ error: 'venue_code, venue_date, and timeSlot are required.' });
  }

  const elementsData = await getVenueData(venue_code, venue_date);
  const result = isTimeslotAvailable(elementsData, timeSlot);
  res.send({ available: result });
});

async function getVenueData(venue_code, venue_date) {
  const your_url = `https://www.li3ib.com/en-kw/venues/${venue_code}?date=${venue_date}`;
  const browser = await puppeteer.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
  ],
});
  const page = await browser.newPage();

  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.82 Safari/537.36');
  await page.setViewport({ width: 1280, height: 800 });

  await page.goto(your_url, { waitUntil: 'networkidle0' });

  try {
    await page.waitForSelector('.venue__timeslot', { timeout: 10000 });
  } catch (error) {
    console.log('Failed to find the elements:', error);
    await browser.close();
    throw new Error('Failed to find the elements.');
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
  return results;
}

app.listen(port, () => {
  console.log(`API listening at http://localhost:${port}`);
});
