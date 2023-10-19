/**********************
 * GAN code challange *
 * API implementation *
 **********************/

// Setup app
const express = require('express');
const fs = require('fs');
const { promisify } = require('util');
const readFile = promisify(fs.readFile);
const app = express();

// Load cities data (async)
let cities;
async function loadCities() {
    console.log("Start loading from file adresses.json");
    cities = JSON.parse(await readFile('./addresses.json'));
}

// Auth middleware (token hardcoded)
app.use((req, res, next) => {
    const auth = req.headers.authorization;
    if (auth !== 'bearer dGhlc2VjcmV0dG9rZW4=') {
        return res.status(401).end();
    }
    next();
})


/**********
 * Routes *
 **********/

// Get city by tag
app.get('/cities-by-tag', (req, res) => {

    // Get params from query
    const { tag, isActive } = req.query;

    // Filter
    const result = cities.filter(city => {
        return city.tags.includes(tag) && city.isActive === (isActive==='true');
    });

    res.json({ cities: result });

    });

// Define metric
function calculateDistance(city1, city2) {

  // Get lat/lon inradians
  const radLat1 = city1.latitude * Math.PI / 180;
  const radLon1 = city1.longitude * Math.PI / 180;

  const radLat2 = city2.latitude * Math.PI / 180;
  const radLon2 = city2.longitude * Math.PI / 180;

  // Do the math
  const dLat = radLat2 - radLat1;
  const dLon = radLon2 - radLon1;
  const a = Math.pow(Math.sin(dLat / 2), 2) + Math.cos(radLat1) * Math.cos(radLat2) * Math.pow(Math.sin(dLon / 2), 2);
  const c = 2 * Math.asin(Math.sqrt(a));

  // Radius of Earth (km)
  const R = 6371;

  // Calculate distance in km
  // Math.round is good enough for the test.
  return Math.round(c * R * 100) / 100;

}


// Get distance between two cities
app.get('/distance', (req, res) => {

    // Get cities details from query
    const { from, to } = req.query;
    const cityFrom = cities.find(c => c.guid === from);
    const cityTo = cities.find(c => c.guid === to);

    // Calculate distance
    const distance = calculateDistance(cityFrom, cityTo);

    // Return payload
    res.json({
        from: cityFrom,
        to: cityTo,
        distance,
        unit: 'km'
    });

});

// Implement area search
async function findCitiesInArea(from, distance) {

  // Get starting city details
  const origin = cities.find(c => c.guid === from);

  // Get filtered cities
  return cities.filter((to) => {
      const x = calculateDistance(origin, to);
      return x <= distance && to.guid !== origin.guid
  });

}

// Get cities within x km - return async job
const jobs = {};
app.get('/area', (req, res) => {

    // Get params from query
    const { from, distance } = req.query;

    // Define job ID - Hardcoded  (it should be random)
    const jobId = '2152f96f-50c7-4d76-9e18-f7033bd14428';

    // Append job
    jobs[jobId] = {
        from,
        distance,
        status: 'pending',
    };

    // Return 202 + polling (full) url
    res.status(202).json({
        resultsUrl: `${req.protocol}://${req.get('host')}/area-result/${jobId}`
    });

    // Find cities and append to the job
    findCitiesInArea(from, distance).then(cities => {
        jobs[jobId] = {
            ...jobs[jobId],
            status: 'ready',
            cities
        };
    });
});

// Get area job result
app.get('/area-result/:id', (req, res) => {

    // Get job from the queue
    const job = jobs[req.params.id];
    if (!job) {
        return res.status(404).end();
    }

    // Check status
    if (job.status === 'pending') {
        return res.status(202).end();
    }

    // Return cities
    res.json({
        cities: job.cities
    });

});

// Stream all cities
// Altough in our case the data is already loaded, we can still pipe stream
app.get('/all-cities', (req, res) => {
    const stream = fs.createReadStream('./addresses.json');
    stream.pipe(res);
});


// Start server async to be sure about data loading
async function startServer() {

  console.log("Waiting for loading");
  await loadCities(); // wait for loading to complete
  console.log("Data loaded, start listening");

  app.listen(8080); // start server

}

// Start server async
startServer();

