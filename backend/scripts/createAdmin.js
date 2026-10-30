// Creates the admin panel's login. Run once on the server from backend/:
//   npm run create-admin
//   npm run create-admin -- --email=you@example.com --password=secret123
const path = require('path');
const readline = require('readline');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const connectDB = require('../config/db');
const Admin = require('../models/Admin');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const askQuestion = (query) => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
};

// Reads a password without showing it, printing * for each character
const askPassword = (query) => new Promise((resolve) => {
  const stdin = process.stdin;
  process.stdout.write(query);
  let password = '';
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');

  const onData = (char) => {
    switch (char) {
      case '\n':
      case '\r':
      case '\u0004': // Ctrl+D
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener('data', onData);
        process.stdout.write('\n');
        resolve(password);
        break;
      case '\u0003': // Ctrl+C
        process.stdout.write('\n');
        process.exit(1);
        break;
      case '\u007f': // Backspace
      case '\b':
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write('\b \b');
        }
        break;
      default:
        password += char;
        process.stdout.write('*');
    }
  };

  stdin.on('data', onData);
});

const readArg = (name) => {
  const arg = process.argv.slice(2).find(a => a.startsWith(`--${name}=`));
  return arg ? arg.slice(name.length + 3) : '';
};

const main = async () => {
  let email = readArg('email').trim().toLowerCase();
  let password = readArg('password');

  if (!email) {
    while (!EMAIL_REGEX.test(email)) {
      email = (await askQuestion('Admin email: ')).toLowerCase();
      if (!EMAIL_REGEX.test(email)) console.log('Please enter a valid email address.');
    }
  } else if (!EMAIL_REGEX.test(email)) {
    throw new Error('Please provide a valid email address.');
  }

  if (!password) {
    while (password.length < 6) {
      password = await askPassword('Admin password (min 6 characters): ');
      if (password.length < 6) {
        console.log('Password must be at least 6 characters.');
        continue;
      }
      if ((await askPassword('Confirm password: ')) !== password) {
        console.log('Passwords do not match, try again.');
        password = '';
      }
    }
  } else if (password.length < 6) {
    throw new Error('Admin password must be at least 6 characters');
  }

  await connectDB();
  if (mongoose.connection.readyState !== 1) throw new Error('Could not connect to MongoDB. Check MONGO_URI in backend/.env.');

  if (await Admin.countDocuments() > 0) {
    throw new Error('An admin already exists. Only one admin can be created.');
  }

  await Admin.create({ email, password: await bcrypt.hash(password, 10) });
  console.log(`Admin created for ${email}`);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
