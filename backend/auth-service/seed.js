const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Since we are running this as a standalone script, we will define the schemas here
// to avoid any relative import or module resolution issues from different microservices.

const MONGODB_URI = "mongodb+srv://shikharkant25_db_user:3zdq3nCxdjnYP4ee@cluster0.dw2hti8.mongodb.net/hackcollab";

const CollegeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  isApproved: { type: Boolean, default: false },
  subscriptionStatus: { type: String, enum: ['PENDING', 'ACTIVE', 'EXPIRED'], default: 'PENDING' }
}, { timestamps: true });

const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true },
  permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }],
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College', default: null }
}, { timestamps: true });

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  collegeId: { type: mongoose.Schema.Types.ObjectId, ref: 'College' },
  roleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  status: { type: String, enum: ['PENDING', 'ACTIVE', 'BLOCKED'], default: 'ACTIVE' },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  registrationFee: { type: Number, default: 0 },
  collegeId: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
  maxTeamSize: { type: Number, default: 4 },
  location: { type: String, required: true },
  image: { type: String, default: '' },
  tags: [{ type: String }],
}, { timestamps: true });

// Register models
const College = mongoose.model('College', CollegeSchema);
const Role = mongoose.model('Role', RoleSchema);
const User = mongoose.model('User', UserSchema);
const Event = mongoose.model('Event', EventSchema);

async function seedDB() {
  try {
    console.log("Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully.");

    // Clear existing sample data to prevent duplication errors on multiple runs (optional)
    console.log("Cleaning up previous test data...");
    await College.deleteMany({ email: { $in: ['admin@demo-college.edu', 'superadmin@hackcollab.com', 'sponsor@company.com'] } });
    await User.deleteMany({ email: { $in: ['admin@demo-college.edu', 'superadmin@hackcollab.com', 'sponsor@company.com', 'student@demo-college.edu'] } });
    await Role.deleteMany({ name: { $in: ['COLLEGE_ADMIN', 'SUPER_ADMIN', 'STUDENT', 'COMPANY_ADMIN'] } });
    await Event.deleteMany({ title: 'Global AI Hackathon 2026' });

    console.log("Seeding Roles...");
    const adminRole = await Role.create({ name: 'COLLEGE_ADMIN' });
    const superAdminRole = await Role.create({ name: 'SUPER_ADMIN' });
    const studentRole = await Role.create({ name: 'STUDENT' });
    const companyAdminRole = await Role.create({ name: 'COMPANY_ADMIN' });
    console.log("Roles created.");

    console.log("Seeding College...");
    const college = await College.create({
      name: "Demo Technology Institute",
      email: "admin@demo-college.edu",
      isApproved: true,
      subscriptionStatus: "ACTIVE"
    });
    console.log(`College '${college.name}' created.`);

    console.log("Seeding Users...");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("Password123!", salt);

    // Super Admin
    const superAdmin = await User.create({
      firstName: "Super",
      lastName: "Admin",
      email: "superadmin@hackcollab.com",
      password: hashedPassword,
      roleId: superAdminRole._id,
      status: "ACTIVE",
      isVerified: true
    });
    console.log(`Super Admin '${superAdmin.email}' created.`);

    // College Admin
    const adminUser = await User.create({
      firstName: "College",
      lastName: "Admin",
      email: "admin@demo-college.edu",
      password: hashedPassword,
      collegeId: college._id,
      roleId: adminRole._id,
      status: "ACTIVE",
      isVerified: true
    });
    console.log(`College Admin '${adminUser.email}' created.`);

    // Student
    const studentUser = await User.create({
      firstName: "Test",
      lastName: "Student",
      email: "student@demo-college.edu",
      password: hashedPassword,
      collegeId: college._id,
      roleId: studentRole._id,
      status: "ACTIVE",
      isVerified: true
    });
    console.log(`Student User '${studentUser.email}' created.`);

    // Sponsor
    const sponsorUser = await User.create({
      firstName: "Demo",
      lastName: "Sponsor",
      email: "sponsor@company.com",
      password: hashedPassword,
      roleId: companyAdminRole._id,
      status: "ACTIVE",
      isVerified: true
    });
    console.log(`Sponsor User '${sponsorUser.email}' created.`);

    console.log("Seeding Hackathons...");
    const startDate = new Date();
    startDate.setDate(startDate.getDate() + 7); // Starts in 7 days
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 2); // 2 days hackathon

    const hackathon = await Event.create({
      title: "Global AI Hackathon 2026",
      description: "Build innovative AI solutions to solve real-world problems. Join us for 48 hours of coding, mentoring, and prizes!",
      startDate: startDate,
      endDate: endDate,
      registrationFee: 0,
      collegeId: college._id,
      createdBy: adminUser._id,
      maxTeamSize: 4,
      location: "Main Auditorium, Demo Institute Campus",
      image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
      tags: ["AI", "Machine Learning", "Innovation"]
    });
    console.log(`Hackathon '${hackathon.title}' created.`);

    console.log("Seeding finished successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error during seeding:", error);
    process.exit(1);
  }
}

seedDB();
