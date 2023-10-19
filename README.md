# GAN Integrity backend code challenge

The script `index.js` uses a local api to perform various operations on a set of cities. Your task is to implement an api so that the script runs successfully all the way to the end.

Run `npm install` and `npm run start` to start the script.

Your api can load the required data from [here](addresses.json).

In the distance calculations you can assume the earth is a perfect sphere and has a radius is 6371 km.

Once you are done, please provide us with a link to a git repo with your code, ready to run.

# API implementation

Based on the KISS principle.

Run `npm install` and `npm run api` to start the API.

## Notes

* Only dependency is express.js
* Code kept in one single file
* Approximate distance to 2 digits.
* Job id is hardcoded.
* Async loading of the data and wait before listening on the port 8080


