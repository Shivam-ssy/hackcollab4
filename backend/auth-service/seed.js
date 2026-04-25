const mongoose = require('mongoose');
const dotenv = require('dotenv');

// We need to load auth models
const College = require('./src/models/College');
const Role = require('./src/models/Role');
const Permission = require('./src/models/Permission');

dotenv.config();

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB for seeding');

    // Create a generic test college
    let college = await College.findOne({ email: 'info@starkuniversity.edu' });
    if (!college) {
      college = new College({
        name: 'Stark University',
        email: 'info@starkuniversity.edu',
        isApproved: true,
        subscriptionStatus: 'ACTIVE'
      });
      await college.save();
      console.log('Seeded College: Stark University');
    }

    // Create permissions
    const perms = ['CREATE_EVENT', 'DELETE_EVENT', 'MANAGE_USERS'];
    const permIds = [];
    for (const p of perms) {
      let perm = await Permission.findOne({ name: p });
      if (!perm) {
        perm = new Permission({ name: p });
        await perm.save();
        console.log(`Seeded Permission: ${p}`);
      }
      permIds.push(perm._id);
    }

    // Create STUDENT role
    let studentRole = await Role.findOne({ name: 'STUDENT' });
    if (!studentRole) {
      studentRole = new Role({
        name: 'STUDENT',
        permissions: [] // default empty or specific
      });
      await studentRole.save();
      console.log('Seeded Role: STUDENT');
    }

    console.log('Seeding completed successfully');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDB();
