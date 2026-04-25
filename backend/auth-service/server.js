const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');

dotenv.config();

// Connect to database
connectDB();

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());

// Load Routes
const authRoutes = require('./src/routes/authRoutes');
const roleRoutes = require('./src/routes/roleRoutes');
const collegeRoutes = require('./src/routes/collegeRoutes');

app.use('/colleges', collegeRoutes);
app.use('/roles', roleRoutes);
app.use('/', authRoutes);

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🔐 Auth Service running on port ${PORT}`);
});