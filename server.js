const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth.js');
const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');
const connectDB = require('./config/db');

const app = express();
connectDB();
app.use( express.json({ extended: false }) );
app.use( cors() );

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000

app.listen(PORT, (err) => {
    if(err) throw err
    console.log(`Running on :${PORT}`);
})

