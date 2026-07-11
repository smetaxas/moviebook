const mongoose = require('mongoose');
const fs = require('fs');
const Movie = require('./models/Movie');
require('dotenv').config();

async function seedMovies() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    await Movie.deleteMany({});
    console.log('Cleared existing movies');

    const movieDatasetFilePath = './movies_dataset.json';

    if (!fs.existsSync(movieDatasetFilePath)) {
      console.error('Dataset file not found!');
      return;
    }

    console.log('Reading dataset file...');
    const moviesData = JSON.parse(fs.readFileSync(movieDatasetFilePath, 'utf8'));

    const insertedMovies = await Movie.insertMany(moviesData);
    console.log(`Successfully seeded ${insertedMovies.length} movies`);

    insertedMovies.forEach(movie => {
      console.log(`- ${movie.title} (${movie.year})`);
    });
  } catch (error) {
    console.error('Error seeding movies:', error);
  } finally {
    mongoose.connection.close();
  }
}

seedMovies();