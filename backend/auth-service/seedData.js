const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const uri = 'mongodb+srv://shikharkant25_db_user:3zdq3nCxdjnYP4ee@cluster0.dw2hti8.mongodb.net/hackcollab';

async function seedData() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection;
    const collections = await db.db.collections();
    
    // Clear existing collections
    for (let collection of collections) {
      await collection.drop();
      console.log(`Dropped ${collection.collectionName}`);
    }

    // ROLES
    const studentRole = { _id: new mongoose.Types.ObjectId(), name: 'STUDENT', permissions: [], collegeId: null, createdAt: new Date(), updatedAt: new Date() };
    const collegeAdminRole = { _id: new mongoose.Types.ObjectId(), name: 'COLLEGE_ADMIN', permissions: [], collegeId: null, createdAt: new Date(), updatedAt: new Date() };
    const judgeRole = { _id: new mongoose.Types.ObjectId(), name: 'JUDGE', permissions: [], collegeId: null, createdAt: new Date(), updatedAt: new Date() };
    const superAdminRole = { _id: new mongoose.Types.ObjectId(), name: 'SUPER_ADMIN', permissions: [], collegeId: null, createdAt: new Date(), updatedAt: new Date() };
    
    await db.db.collection('roles').insertMany([studentRole, collegeAdminRole, judgeRole, superAdminRole]);
    console.log('Roles seeded.');

    const passwordHash = await bcrypt.hash('password123', 10);

    // SUPER ADMIN
    const superAdminId = new mongoose.Types.ObjectId();
    await db.db.collection('users').insertOne({
      _id: superAdminId,
      firstName: 'Super',
      lastName: 'Admin',
      email: 'admin@hackcollab.com',
      password: passwordHash,
      roleId: superAdminRole._id,
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 3 COLLEGES
    const collegesData = [];
    const collegeAdmins = [];
    const students = [];
    const judges = [];
    const events = [];
    const teams = [];
    const submissions = [];
    const leaderboards = [];
    const participations = [];

    for (let i = 1; i <= 3; i++) {
      const collegeId = new mongoose.Types.ObjectId();
      collegesData.push({
        _id: collegeId,
        name: `College of Tech ${i}`,
        email: `contact@college${i}.edu`,
        isApproved: true,
        subscriptionStatus: 'ACTIVE',
        paymentStatus: 'COMPLETED',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // 1 Admin per college
      const adminId = new mongoose.Types.ObjectId();
      collegeAdmins.push({
        _id: adminId,
        firstName: `Admin${i}`,
        lastName: `College${i}`,
        email: `admin@college${i}.edu`,
        password: passwordHash,
        collegeId: collegeId,
        roleId: collegeAdminRole._id,
        role: 'COLLEGE_ADMIN',
        status: 'ACTIVE',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Events for this college
      const eventId = new mongoose.Types.ObjectId();
      events.push({
        _id: eventId,
        title: `Hackathon ${i} 2026`,
        description: `A massive hackathon for College ${i}`,
        startDate: new Date(Date.now() - 86400000 * 2), // Started 2 days ago
        endDate: new Date(Date.now() + 86400000 * 2), // Ends in 2 days
        registrationFee: 0,
        collegeId: collegeId,
        createdBy: adminId,
        maxTeamSize: 4,
        location: 'Campus Main Hall',
        tags: ['Web3', 'AI', 'IoT'],
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    await db.db.collection('colleges').insertMany(collegesData);
    
    // Create 4 Judges, distributed among colleges
    for(let i=1; i<=4; i++) {
      const collegeIndex = i % 3;
      judges.push({
        _id: new mongoose.Types.ObjectId(),
        firstName: `Judge`,
        lastName: `${i}`,
        email: `judge${i}@college${collegeIndex+1}.edu`,
        password: passwordHash,
        collegeId: collegesData[collegeIndex]._id,
        roleId: judgeRole._id,
        role: 'JUDGE',
        status: 'ACTIVE',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    // 10 Students, distributed
    for(let i=1; i<=10; i++) {
      const collegeIndex = i % 3;
      const sId = new mongoose.Types.ObjectId();
      students.push({
        _id: sId,
        firstName: `Student`,
        lastName: `${i}`,
        email: `student${i}@college${collegeIndex+1}.edu`,
        password: passwordHash,
        collegeId: collegesData[collegeIndex]._id,
        roleId: studentRole._id,
        role: 'STUDENT',
        status: 'ACTIVE',
        isVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Participate in their college's event
      participations.push({
        userId: sId,
        eventId: events[collegeIndex]._id,
        paymentStatus: 'PAID',
        amountPaid: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }

    await db.db.collection('users').insertMany([...collegeAdmins, ...judges, ...students]);
    await db.db.collection('events').insertMany(events);
    await db.db.collection('participations').insertMany(participations);

    // Create Teams and Submissions
    for(let i=0; i<3; i++) {
      const teamId = new mongoose.Types.ObjectId();
      const event = events[i];
      const eventStudents = students.filter(s => s.collegeId.equals(event.collegeId));
      
      if (eventStudents.length === 0) continue;

      const members = eventStudents.slice(0, 3).map(s => ({
        userId: s._id,
        role: s._id.equals(eventStudents[0]._id) ? 'LEADER' : 'MEMBER',
        joinedAt: new Date()
      }));

      teams.push({
        _id: teamId,
        name: `Team Alpha ${i+1}`,
        eventId: event._id,
        leaderId: eventStudents[0]._id,
        members: members,
        status: 'ACTIVE',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Create Submission
      const submissionId = new mongoose.Types.ObjectId();
      submissions.push({
        _id: submissionId,
        teamId: teamId,
        eventId: event._id,
        githubUrl: 'https://github.com/example/project',
        videoUrl: 'https://youtube.com/watch?v=demo',
        description: `This is a sample project submission for Team Alpha ${i+1}.`,
        score: Math.floor(Math.random() * 20) + 80,
        feedback: 'Great job!',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Leaderboard
      for(let member of members) {
        leaderboards.push({
          eventId: event._id,
          userId: member.userId,
          userName: `${eventStudents.find(s=>s._id.equals(member.userId)).firstName} ${eventStudents.find(s=>s._id.equals(member.userId)).lastName}`,
          score: submissions[submissions.length - 1].score,
          achievements: ['Project Submitted'],
          college: collegesData[i].name,
          createdAt: new Date(),
          updatedAt: new Date(),
          __v: 0
        });
      }
    }

    if (teams.length > 0) await db.db.collection('teams').insertMany(teams);
    if (submissions.length > 0) await db.db.collection('submissions').insertMany(submissions);
    if (leaderboards.length > 0) await db.db.collection('leaderboards').insertMany(leaderboards);

    console.log('Seed completed successfully.');
    console.log('--- TEST ACCOUNTS ---');
    console.log('Super Admin: admin@hackcollab.com');
    console.log('College Admins: admin@college1.edu, admin@college2.edu, admin@college3.edu');
    console.log('Judges: judge1@college2.edu, judge2@college3.edu, judge3@college1.edu, judge4@college2.edu');
    console.log('Students: student1@college2.edu ... student10@college2.edu');
    console.log('Password for all users: password123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seedData();
