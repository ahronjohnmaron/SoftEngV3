const express = require('express');
const cors = require('cors'); 
const nodemailer = require('nodemailer');
const { generateOTPEmailHTML, generateOTPEmailText } = require('./emailTemplates');
const app = express();
const PORT = 3000;

app.use(cors()); 
app.use(express.json());

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'campusannouncement54321@gmail.com',        // your Gmail address
    pass: 'rbly ljai mqsy rcbo'                       // your Gmail app password
  }
});

const otpStore = {}; // Store OTPs by email (in-memory, resets on server restart)

// Send OTP to email
app.post('/send-otp', (req, res) => {
  console.log('📧 Received OTP request for:', req.body.email);
  
  const { email } = req.body;
  if (!email) {
    console.log('❌ No email provided');
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  otpStore[email] = otp; // Store the OTP with the email as key
  console.log('🔑 Generated OTP for', email, ':', otp);

  let mailOptions;
  try {
    mailOptions = {
      from: 'campusannouncement54321@gmail.com',
      to: email,
      subject: 'Your Campus Login OTP Code',
      text: generateOTPEmailText(otp),
      html: generateOTPEmailHTML(otp, email)
    };
  } catch (error) {
    console.error('⚠️ Template generation error:', error);
    // Fallback to simple plain text email
    mailOptions = {
      from: 'campusannouncement54321@gmail.com',
      to: email,
      subject: 'Your Campus Login OTP Code',
      text: `Your OTP code is ${otp}`
    };
  }

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('❌ Email send error:', error);
      return res.status(500).json({ success: false, message: 'Failed to send OTP' });
    }
    console.log('✅ OTP sent successfully:', info.response);
    res.json({ success: true, message: 'OTP sent' }); // Don't send OTP back to client!
  });
});

// Verify OTP
app.post('/verify-otp', (req, res) => {
  console.log('🔍 Received OTP verification request for:', req.body.email);
  
  const { email, otp } = req.body;
  if (!email || !otp) {
    console.log('❌ Missing email or OTP');
    return res.status(400).json({ success: false, message: 'Email and OTP required' });
  }

  console.log('🔑 Verifying OTP:', otp, 'against stored:', otpStore[email]);
  
  if (otpStore[email] === otp) {
    console.log('✅ OTP verified successfully for:', email);
    delete otpStore[email]; // OTP used, remove from store
    return res.json({ success: true, message: "OTP verified!" });
  } else {
    console.log('❌ Invalid OTP for:', email);
    return res.status(400).json({ success: false, message: "Invalid OTP" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
