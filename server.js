// Backend: server.js
const express = require('express');
const mysql2 = require('mysql2');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();
require('dotenv').config();
const PORT = process.env.PORT;
const fileUpload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;

require('dotenv').config();


app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// MySQL Aiven DB config
const dbConfig =process.env.MYSQL_URL;
const mySqlServer = mysql2.createConnection(dbConfig);

mySqlServer.connect(function (err) {
    if (err != null) {
        console.log(err.message);
    } else {
        console.log("Connected to DB");
    }
});

const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
    secure: true,
    host: 'smtp.gmail.com',
    port: 465,
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS
    }
});

function sendMail(to, sub, msg) {
    transporter.sendMail({
        to: to,
        subject: sub,
        html: msg
    })
}

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

// Create users table if not exists
const createTableSQL = `
CREATE TABLE IF NOT EXISTS users (
    email VARCHAR(255) PRIMARY KEY,
    password VARCHAR(255),
    status TINYINT DEFAULT 1,
    type varchar(10)
)`;
mySqlServer.query(createTableSQL, (err) => {
    if (err) {
        console.error('Error creating users table:', err.message);
    } else {
        console.log('Users table is ready.');
    }
});

// Create volunteer_profiles table if not exists
const createVolunteerTableSQL = `
CREATE TABLE IF NOT EXISTS volunteer_profiles (
    email VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    address VARCHAR(255),
    contact VARCHAR(50),
    city VARCHAR(100),
    gender VARCHAR(20),
    dob DATE,
    qualification VARCHAR(255),
    occupation VARCHAR(255),
    otherinfo TEXT,
    selfpic VARCHAR(500),
    idproof VARCHAR(500),
    idproofnum VARCHAR(100)
)`;
mySqlServer.query(createVolunteerTableSQL, (err) => {
    if (err) {
        console.error('Error creating volunteer_profiles table:', err.message);
    } else {
        console.log('Volunteer profiles table is ready.');
    }
});

// Create client_profiles table if not exists
const createClientTableSQL = `
CREATE TABLE IF NOT EXISTS client_profiles (
    email VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    firm VARCHAR(255),
    business_profile VARCHAR(255),
    contact VARCHAR(50),
    address VARCHAR(255),
    city VARCHAR(100),
    gender VARCHAR(20),
    idproof VARCHAR(500),
    selfpicproof VARCHAR(500),
    idproofnum VARCHAR(100),
    otherinfo TEXT
)`;
mySqlServer.query(createClientTableSQL, (err) => {
    if (err) {
        console.error('Error creating client_profiles table:', err.message);
    } else {
        console.log('Client profiles table is ready.');
    }
});

// Create jobs table if not exists
const createJobsTableSQL = `
CREATE TABLE IF NOT EXISTS jobs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clientid VARCHAR(255),
    jobtitle VARCHAR(255),
    jobtype ENUM('Part Time', 'Full Time'),
    firmaddress VARCHAR(255),
    city VARCHAR(100),
    education VARCHAR(255),
    contactperson VARCHAR(255),
    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`;
mySqlServer.query(createJobsTableSQL, (err) => {
    if (err) {
        console.error('Error creating jobs table:', err.message);
    } else {
        console.log('Jobs table is ready.');
    }
});

// Create beggar_profiles table if not exists
const createBeggarTableSQL = `
CREATE TABLE IF NOT EXISTS beggar_profiles (
    volunteer_email VARCHAR(255),
    name VARCHAR(255),
    address VARCHAR(255),
    contact VARCHAR(50),
    city VARCHAR(100),
    gender VARCHAR(20),
    dob DATE,
    idproof VARCHAR(500),
    idproofnum VARCHAR(100) PRIMARY KEY,
    otherinfo TEXT,
    photo VARCHAR(500)
)`;
mySqlServer.query(createBeggarTableSQL, (err) => {
    if (err) {
        console.error('Error creating beggar_profiles table:', err.message);
    } else {
        console.log('Beggar profiles table is ready.');
    }
});

// Create applicants table with extra fields if not already present
const createApplicantsTableSQL = `
CREATE TABLE IF NOT EXISTS applicants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    jobid INT,
    beggar_email VARCHAR(255),
    beggar_name VARCHAR(255),
    beggar_idproofnum VARCHAR(100),
    beggar_contact VARCHAR(50),
    beggar_city VARCHAR(100),
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_applicant (jobid, beggar_email)
)`;
mySqlServer.query(createApplicantsTableSQL, (err) => {
    if (err) {
        console.error('Error creating applicants table:', err.message);
    } else {
        console.log('Applicants table is ready.');
    }
});

// Apply for a job (store volunteer details in applicants)
app.post('/apply-job', (req, res) => {
    const { jobid, volunteer_email } = req.body;
    if (!jobid || !volunteer_email) {
        return res.status(400).json({ error: 'Job ID and volunteer email required.' });
    }

    // 1) Fetch volunteer profile
    const fetchVolSql = 'SELECT name, contact, city, idproofnum FROM volunteer_profiles WHERE email = ?';
    mySqlServer.query(fetchVolSql, [volunteer_email], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!rows || rows.length === 0) {
            return res.status(404).json({ error: 'Volunteer profile not found.' });
        }

        const vol = rows[0] || {};
        const vname = vol.name || null;
        const vcontact = vol.contact || null;
        const vcity = vol.city || null;
        const vidproofnum = vol.idproofnum || null;

        // 2) Insert into applicants (fail with duplicate if already applied)
        const insertSql = `
            INSERT INTO applicants (jobid, beggar_email, beggar_name, beggar_idproofnum, beggar_contact, beggar_city)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        const params = [jobid, volunteer_email, vname, vidproofnum, vcontact, vcity];
        mySqlServer.query(insertSql, params, (insErr, result) => {
            if (insErr) {
                if (insErr.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'Already applied.' });
                }
                return res.status(500).json({ error: insErr.message });
            }
            res.json({ success: true, message: 'Applied successfully.' });
        });
    });
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(fileUpload());

cloudinary.config({
    cloud_name: 'dh8lnyyc2',
    api_key: '187775598473549',
    api_secret: 'M30i2HPJo8QCVYWRAssg1BCb48M'
});

// Signup endpoint
app.post('/signup', (req, res) => {
    const { email, password, type } = req.body;
    if (!email || !password || !type) {
        return res.status(400).json({ error: 'Email, password, and type required' });
    }
    const sql = 'INSERT INTO users (email, password, status, type) VALUES (?, ?, 1, ?)';
    mySqlServer.query(sql, [email, password, type], (err, result) => {
        if (err) {
            if (err.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ error: 'Email already exists' });
            }
            return res.status(500).json({ error: err.message });
        }
        // Send confirmation email
        sendMail(email, 'Signup Confirmation', 'Thank you for signing up for HOPEBRIDGE');
        res.json({ success: true, email, type });
    });
});

// Login endpoint
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password required' });
    }

    const sql = 'SELECT * FROM users WHERE email = ? AND password = ?';
    mySqlServer.query(sql, [email, password], (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (results.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        // Blocked user handling
        const user = results[0];
        if (Number(user.status) === 0) {
            return res.status(403).json({ error: 'sorry u have been blocked by the admin. kindly contact for the account working again' });
        }
        // Return user type for dashboard redirect
        sendMail(email, 'Login Confirmation', 'Thank you for logging in to HOPEBRIDGE');
        res.json({ success: true, email, type: results[0].type });
    });
});

// Admin: fetch users by type with basic profile info
app.get('/admin/users', (req, res) => {
    const { type } = req.query; // 'volunteer' | 'client'
    if (!type || !['volunteer', 'client'].includes(type)) {
        return res.status(400).json({ error: 'Valid type required: volunteer or client' });
    }

    let sql;
    if (type === 'volunteer') {
        sql = `
            SELECT u.email, u.status, u.type,
                   vp.name, vp.city, vp.contact, vp.selfpic AS photo
            FROM users u
            LEFT JOIN volunteer_profiles vp ON vp.email = u.email
            WHERE u.type = 'volunteer'
            ORDER BY u.email ASC`;
    } else {
        sql = `
            SELECT u.email, u.status, u.type,
                   cp.name, cp.city, cp.contact, cp.selfpicproof AS photo
            FROM users u
            LEFT JOIN client_profiles cp ON cp.email = u.email
            WHERE u.type = 'client'
            ORDER BY u.email ASC`;
    }

    mySqlServer.query(sql, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows || []);
    });
});

// Admin: update user status (0 = blocked, 1 = active)
app.post('/admin/user-status', (req, res) => {
    const { email, status } = req.body;
    if (!email || (status !== 0 && status !== 1 && status !== '0' && status !== '1')) {
        return res.status(400).json({ error: 'Email and status (0|1) required' });
    }
    const numericStatus = Number(status) === 1 ? 1 : 0;
    const sql = 'UPDATE users SET status = ? WHERE email = ?';
    mySqlServer.query(sql, [numericStatus, email], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'User not found' });
        res.json({ success: true, email, status: numericStatus });
    });
});

// Register volunteer profile (create only, error on duplicate)
app.post('/register-volunteer', async (req, res) => {
    try {
        let data = req.body;
        if (!data.email) return res.status(400).json({ error: 'Email is required' });
        // Handle file uploads
        if (req.files) {
            if (req.files.selfpic) {
                let selfpicname = req.files.selfpic.name;
                let locationtosave = path.join(__dirname, 'uploads', selfpicname);
                await req.files.selfpic.mv(locationtosave);
                let picurlresult = await cloudinary.uploader.upload(locationtosave);
                data.selfpic = picurlresult.secure_url;
            }
            if (req.files.idproof) {
                let idproofname = req.files.idproof.name;
                let locationtosave = path.join(__dirname, 'uploads', idproofname);
                await req.files.idproof.mv(locationtosave);
                let idproofurlresult = await cloudinary.uploader.upload(locationtosave);
                data.idproof = idproofurlresult.secure_url;
            }
        }
        const sql = `INSERT INTO volunteer_profiles (email, name, address, contact, city, gender, dob, qualification, occupation, otherinfo, selfpic, idproof, idproofnum) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [
            data.email, data.name, data.address, data.contact, data.city, data.gender, data.dob, data.qualification, data.occupation, data.otherinfo, data.selfpic, data.idproof, data.idproofnum
        ];
        mySqlServer.query(sql, values, (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'Duplicate entry: A volunteer with this email already exists.' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, message: 'Volunteer profile registered', data });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update volunteer profile by email
app.post('/update-volunteer', async (req, res) => {
    let data = req.body;
    // console.log("data is ", data);

    let name = data.name;
    let address = data.address;
    let contact = data.contact;
    let city = data.city;
    let gender = data.gender;
    let dob = data.dob;
    let qualification = data.qualification;
    let occupation = data.occupation;
    let otherinfo = data.otherinfo;
    let idproofnum = data.idproofnum;
    let selfpic;
    let idproof;

    if (!data.email) return res.status(400).json({ error: 'Email is required' });

    // SELF PIC
    if (req.files && req.files.selfpic) {
        try {
            let selfpicName = req.files.selfpic.name;
            let locationToSave = path.join(__dirname, 'uploads', selfpicName);
            await req.files.selfpic.mv(locationToSave);
            let uploadResult = await cloudinary.uploader.upload(locationToSave);
            selfpic = uploadResult.secure_url;
            console.log("selfpic is ", selfpic);
        } catch (err) {
            console.log("error in uploading selfpic", err);
            return res.status(500).json({ error: 'Error uploading selfpic' });
        }
    } else {
        selfpic = data.selfpic_old;
    }

    // ID PROOF
    if (req.files && req.files.idproof) {
        try {
            let idproofName = req.files.idproof.name;
            let locationToSave = path.join(__dirname, 'uploads', idproofName);
            await req.files.idproof.mv(locationToSave);
            let uploadResult = await cloudinary.uploader.upload(locationToSave);
            idproof = uploadResult.secure_url;
            console.log("idproof is ", idproof);
        } catch (err) {
            console.log("error in uploading idproof", err);
            return res.status(500).json({ error: 'Error uploading idproof' });
        }
    } else {
        idproof = data.idproof_old;
    }
    const sql = `
        UPDATE volunteer_profiles 
        SET name = ?, address = ?, contact = ?, city = ?, gender = ?, dob = ?, qualification = ?, occupation = ?, otherinfo = ?, selfpic = ?, idproof = ?, idproofnum = ? 
        WHERE email = ?`;

    const values = [name, address, contact, city, gender, dob, qualification, occupation, otherinfo, selfpic, idproof, idproofnum, data.email];

    mySqlServer.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Volunteer profile updated', data });
    });
});


// Fetch volunteer profile (GET for AJAX pattern)
app.get('/fetch-volunteer', (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const sql = 'SELECT * FROM volunteer_profiles WHERE email = ?';
    mySqlServer.query(sql, [email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.json([]); // Return empty array for not found
        res.json([results[0]]); // Return as array for compatibility
    });
});

// Save (register) client profile
app.post('/register-client', async (req, res) => {
    try {
        let data = req.body;
        if (!data.email) return res.status(400).json({ error: 'Email is required' });
        // Handle file uploads for idproof and selfpicproof
        if (req.files && req.files.idproof) {
            let idproofname = req.files.idproof.name;
            let locationtosave = path.join(__dirname, 'uploads', idproofname);
            await req.files.idproof.mv(locationtosave);
            let idproofurlresult = await cloudinary.uploader.upload(locationtosave);
            data.idproof = idproofurlresult.secure_url;
        }
        if (req.files && req.files.selfpicproof) {
            let selfpicname = req.files.selfpicproof.name;
            let locationtosave = path.join(__dirname, 'uploads', selfpicname);
            await req.files.selfpicproof.mv(locationtosave);
            let selfpicurlresult = await cloudinary.uploader.upload(locationtosave);
            data.selfpicproof = selfpicurlresult.secure_url;
        }
        const sql = `INSERT INTO client_profiles (email, name, firm, business_profile, contact, address, city, gender, idproof, selfpicproof, idproofnum, otherinfo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [
            data.email, data.name, data.firm, data.business_profile, data.contact, data.address, data.city, data.gender, data.idproof, data.selfpicproof, data.idproofnum, data.otherinfo
        ];
        mySqlServer.query(sql, values, (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ success: true, message: 'Client profile registered', data });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Change (update) client profile
app.post('/update-client', async (req, res) => {
    let data = req.body;
    console.log("data is ", data);
    let name = data.name;
    let firm = data.firm;
    let business_profile = data.business_profile;
    let contact = data.contact;
    let address = data.address;
    let city = data.city;
    let gender = data.gender;
    let idproofnum = data.idproofnum;
    let otherinfo = data.otherinfo;
    let idproof;
    let selfpicproof;
    let email = data.email;

    if (!data.email) return res.status(400).json({ error: 'Email is required' });

    if (req.files && req.files.selfpicproof) {
        try {
            console.log("hiiii");
            let selfpicname = req.files.selfpicproof.name;
            let locationtosave = path.join(__dirname, 'uploads', selfpicname);
            await req.files.selfpicproof.mv(locationtosave);
            let selfpicurlresult = await cloudinary.uploader.upload(locationtosave);
            selfpicproof = selfpicurlresult.secure_url;
            // console.log("selfpicproof is ", selfpicproof);
        } catch (err) {
            console.log("error in uploading selfpicproof", err);
            return res.status(500).json({ error: 'Error uploading selfpicproof' });
        }
    }
    else {
        selfpicproof = data.selfpicproof_old;
        // console.log("selfpicproof is ", selfpicproof);
    }
    if (req.files && req.files.idproof) {
        try {
            let idproofname = req.files.idproof.name;
            let locationtosave = path.join(__dirname, 'uploads', idproofname);
            await req.files.idproof.mv(locationtosave);
            let idproofurlresult = await cloudinary.uploader.upload(locationtosave);
            idproof = idproofurlresult.secure_url;
            // console.log("idproof is ", idproof);
        } catch (err) {
            console.log("error in uploading idproof", err);
            return res.status(500).json({ error: 'Error uploading idproof' });
        }
    }
    else {
        idproof = data.idproof_old;
    }
    const sql = `REPLACE INTO client_profiles (email, name, firm, business_profile, contact, address, city, gender, idproof, selfpicproof, idproofnum, otherinfo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [
        email, name, firm, business_profile, contact, address, city, gender, idproof, selfpicproof, idproofnum, otherinfo
    ];
    mySqlServer.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Client profile registered/updated', data });
    });
});

// Search (fetch) client profile (GET for AJAX pattern)
app.get('/fetch-client', (req, res) => {
    const { email } = req.query;
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const sql = 'SELECT * FROM client_profiles WHERE email = ?';
    mySqlServer.query(sql, [email], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.json([]); // Return empty array for not found
        res.json([results[0]]); // Return as array for compatibility
    });
});

// Register beggar profile (create)
app.post('/register-beggar', async (req, res) => {
    try {
        let data = req.body;
        if (!data.volunteer_email) return res.status(400).json({ error: 'Volunteer email is required' });
        if (!data.idproofnum) return res.status(400).json({ error: 'ID Proof Number is required' });
        // Handle file uploads
        if (req.files) {
            if (req.files.idproof) {
                let idproofname = req.files.idproof.name;
                let locationtosave = path.join(__dirname, 'uploads', idproofname);
                await req.files.idproof.mv(locationtosave);
                let idproofurlresult = await cloudinary.uploader.upload(locationtosave);
                data.idproof = idproofurlresult.secure_url;
            }
            if (req.files.photo) {
                let photoname = req.files.photo.name;
                let locationtosave = path.join(__dirname, 'uploads', photoname);
                await req.files.photo.mv(locationtosave);
                let photourlresult = await cloudinary.uploader.upload(locationtosave);
                data.photo = photourlresult.secure_url;
            }
        }
        const sql = `INSERT INTO beggar_profiles (volunteer_email, name, address, contact, city, gender, dob, idproof, idproofnum, otherinfo, photo) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        const values = [
            data.volunteer_email, data.name, data.address, data.contact, data.city, data.gender, data.dob, data.idproof, data.idproofnum, data.otherinfo, data.photo
        ];
        mySqlServer.query(sql, values, (err, result) => {
            if (err) {
                if (err.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({ error: 'Duplicate entry: A beggar with this ID Proof Number already exists.' });
                }
                return res.status(500).json({ error: err.message });
            }
            res.json({ success: true, message: 'Beggar profile registered', idproofnum: data.idproofnum });
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update beggar profile by idproofnum
app.post('/update-beggar', async (req, res) => {
    let data = req.body;
    console.log("data is ", data);
    let name = data.name;
    let address = data.address;
    let contact = data.contact;
    let city = data.city;
    let gender = data.gender;
    let dob = data.dob;
    let idproofnum = data.idproofnum;
    let otherinfo = data.otherinfo;
    let idproof;
    let photo;
    let volunteer_email = data.volunteer_email;

    if (!data.volunteer_email) return res.status(400).json({ error: 'Volunteer email is required' });

    if (req.files && req.files.idproof) {
        try {
            let idproofname = req.files.idproof.name;
            let locationtosave = path.join(__dirname, 'uploads', idproofname);
            await req.files.idproof.mv(locationtosave);
            let idproofurlresult = await cloudinary.uploader.upload(locationtosave);
            idproof = idproofurlresult.secure_url;
            // console.log("idproof is ", idproof);
        } catch (err) {
            console.log("error in uploading idproof", err);
            return res.status(500).json({ error: 'Error uploading idproof' });
        }
    }
    else {
        idproof = data.idproof_old;
        console.log("old idproof is ", idproof);
    }
    if (req.files && req.files.photo) {
        try {
            let photoname = req.files.photo.name;
            let locationtosave = path.join(__dirname, 'uploads', photoname);
            await req.files.photo.mv(locationtosave);
            let photourlresult = await cloudinary.uploader.upload(locationtosave);
            photo = photourlresult.secure_url;
            // console.log("photo is ", photo);
        } catch (err) {
            console.log("error in uploading photo", err);
            return res.status(500).json({ error: 'Error uploading photo' });
        }
    }
    else {
        photo = data.photo_old;
        console.log("old photo is ", photo);
    }
    const sql = `UPDATE beggar_profiles SET volunteer_email = ?, name = ?, address = ?, contact = ?, city = ?, gender = ?, dob = ?, idproof = ?, idproofnum = ?, otherinfo = ?, photo = ? WHERE idproofnum = ?`;
    const values = [
        volunteer_email, name, address, contact, city, gender, dob, idproof, idproofnum, otherinfo, photo, idproofnum
    ];
    mySqlServer.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Beggar profile registered/updated', idproofnum: data.idproofnum });
    });
});

// Fetch beggar profile(s)
// Supports:
//  - GET /fetch-beggars?idproofnum=XXXXXXXX  -> returns single-profile array by primary key
//  - GET /fetch-beggars?volunteer_email=...  -> returns all profiles for a volunteer
app.get('/fetch-beggars', (req, res) => {
    const { idproofnum, volunteer_email } = req.query;

    // Prefer direct lookup by primary key (ID Proof Number)
    if (idproofnum) {
        const sql = 'SELECT * FROM beggar_profiles WHERE idproofnum = ?';
        return mySqlServer.query(sql, [idproofnum], (err, results) => {
            if (err) {
                console.error('Database error (idproofnum):', err);
                return res.status(500).json({ error: err.message });
            }
            if (!results || results.length === 0) return res.json([]);
            return res.json([results[0]]);
        });
    }

    // Fallback: list all for a volunteer
    if (volunteer_email) {
        const sql = 'SELECT * FROM beggar_profiles WHERE volunteer_email = ?';
        return mySqlServer.query(sql, [volunteer_email], (err, results) => {
            if (err) {
                console.error('Database error (volunteer_email):', err);
                return res.status(500).json({ error: err.message });
            }
            return res.json(results || []);
        });
    }

    // If neither provided
    return res.status(400).json({ error: 'idproofnum or volunteer_email required' });
});


app.post('/delete-beggar', (req, res) => {
    const idproofnum = req.body.idproofnum;
    if (!idproofnum) return res.status(400).json({ error: 'ID Proof Number is required' });
    const sql = 'DELETE FROM beggar_profiles WHERE idproofnum = ?';
    mySqlServer.query(sql, [idproofnum], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Profile not found' });
        res.json({ success: true, message: 'Beggar profile deleted' });
    });
});

// Post job endpoint
app.post('/post-job', (req, res) => {
    const { clientid, jobtitle, jobtype, firmaddress, city, education, contactperson } = req.body;
    if (!clientid || !jobtitle || !jobtype || !firmaddress || !city) {
        return res.status(400).json({ error: 'All required fields must be filled' });
    }
    const sql = `INSERT INTO jobs (clientid, jobtitle, jobtype, firmaddress, city, education, contactperson) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    const values = [clientid, jobtitle, jobtype, firmaddress, city, education, contactperson];
    mySqlServer.query(sql, values, (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, message: 'Job published!', jobId: result.insertId });
    });
});

// Fetch job by ID
app.get('/fetch-job', (req, res) => {
    const { jobid } = req.query;
    if (!jobid) return res.status(400).json({ error: 'Job ID is required' });
    const sql = 'SELECT * FROM jobs WHERE id = ?';
    mySqlServer.query(sql, [jobid], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length === 0) return res.json([]); // Return empty array for not found
        res.json([results[0]]); // Return as array for compatibility
    });
});

// Delete job by ID
app.delete('/delete-job', (req, res) => {
    const jobid = req.body.jobid || req.query.jobid;
    if (!jobid) return res.status(400).json({ error: 'Job ID is required' });
    const sql = 'DELETE FROM jobs WHERE id = ?';
    mySqlServer.query(sql, [jobid], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Job not found' });
        // Delete applicants for this job
        mySqlServer.query('DELETE FROM applicants WHERE jobid = ?', [jobid], (err2) => {
            if (err2) console.error('Error deleting applicants:', err2.message);
            // Continue anyway
            res.json({ success: true, message: 'Job and applicants deleted' });
        });
    });
});

// Get all jobs for Find Jobs page with filters
app.get('/all-jobs', (req, res) => {
    let { city, jobtitle, education } = req.query;
    let sql = 'SELECT * FROM jobs WHERE 1=1';
    let params = [];
    if (city) {
        sql += ' AND city LIKE ?';
        params.push(`%${city}%`);
    }
    if (jobtitle) {
        sql += ' AND jobtitle LIKE ?';
        params.push(`%${jobtitle}%`);
    }
    if (education === 'yes') {
        sql += ' AND education IS NOT NULL AND education != ""';
    } else if (education === 'no') {
        sql += ' AND (education IS NULL OR education = "")';
    }
    sql += ' ORDER BY posted_at DESC';
    mySqlServer.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});

// Get all jobs by client email
app.get('/jobs-by-client', (req, res) => {
    const { clientid } = req.query;
    if (!clientid) return res.status(400).json({ error: 'Client email is required' });
    const sql = 'SELECT * FROM jobs WHERE clientid = ? ORDER BY posted_at DESC';
    mySqlServer.query(sql, [clientid], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});


// Serve index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ensure 'gender' column exists in client_profiles (migration for old tables)
mySqlServer.query(
    "SHOW COLUMNS FROM client_profiles LIKE 'gender'",
    (err, results) => {
        if (err) {
            console.error('Error checking gender column:', err.message);
        } else if (results.length === 0) {
            mySqlServer.query(
                "ALTER TABLE client_profiles ADD COLUMN gender VARCHAR(20)",
                (err2) => {
                    if (err2) {
                        console.error('Error adding gender column:', err2.message);
                    } else {
                        console.log('Added gender column to client_profiles.');
                    }
                }
            );
        }
    }
);

const fs = require('fs');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Get applicants for a job (by jobid and jobtitle)
app.get('/job-applicants', (req, res) => {
    const { jobid, jobtitle } = req.query;
    // If jobid is provided, use it; else if jobtitle is provided, use that
    let sql, params;
    if (jobid) {
        sql = 'SELECT * FROM applicants WHERE jobid = ?';
        params = [jobid];
    } else if (jobtitle) {
        // Get jobid(s) for this jobtitle
        sql = 'SELECT * FROM applicants WHERE jobid IN (SELECT id FROM jobs WHERE jobtitle = ?)';
        params = [jobtitle];
    } else {
        return res.status(400).json({ error: 'Job ID or Job Title required.' });
    }
    mySqlServer.query(sql, params, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(results);
    });
});