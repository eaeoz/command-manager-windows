require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Configuration = require('../models/Configuration');

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    const mongoUri = `${process.env.MONGODB_URI}${process.env.DATABASE_NAME}`;
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('📦 Connected to MongoDB');
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    
    if (existingAdmin) {
      console.log('⚠️  Admin user already exists!');
      console.log('   Email: admin@example.com');
      process.exit(0);
    }
    
    // Create admin user
    const admin = await User.create({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123', // Will be hashed automatically
      role: 'admin',
      isActive: true
    });
    
    // Create empty configuration for admin
    await Configuration.create({
      userId: admin._id,
      profiles: [],
      commands: []
    });
    
    console.log('✅ Admin user created successfully!');
    console.log('');
    console.log('📧 Email: admin@example.com');
    console.log('🔑 Password: admin123');
    console.log('');
    console.log('⚠️  IMPORTANT: Change the password after first login!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
