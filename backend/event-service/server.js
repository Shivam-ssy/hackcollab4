const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');

dotenv.config();

// Connect to DB
connectDB();

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// Load Routes
const eventRoutes = require('./src/routes/eventRoutes');

// Mount routes
app.use('/', eventRoutes);

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`🎉 Event Service running on port ${PORT}`);
});
