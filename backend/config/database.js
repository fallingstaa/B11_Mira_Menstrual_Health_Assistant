const mongoose = require("mongoose");
const dns = require("dns");

// Node's resolver can pick up a stale/leftover DNS server (e.g. a VPN or
// DoH proxy that installed 127.0.0.1 as a resolver and isn't running
// anymore), which breaks the SRV lookup MongoDB Atlas needs
// (mongodb+srv://...) even though normal DNS on the machine works fine.
// Force known-good public resolvers so `querySrv` doesn't get ECONNREFUSED.
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        console.log("MongoDB connected successfully");
    } catch (error) {
        console.error("MongoDB connection failed:", error.message);
        process.exit(1);
    }
};

module.exports = connectDB;