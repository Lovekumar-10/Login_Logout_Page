import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';


const app = express();
const port = 2000;

// Cloudinary Configuration
cloudinary.config({ 
    cloud_name: 'dtylb1sfu', 
    api_key: '722328585371274', 
    api_secret: 'ka9Ew4CnVg_57fM8qhwXFYurf7c'
});

//  Middleware
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));  

//  Connect to MongoDB
mongoose.connect("mongodb+srv://lovekumar161129:rJi9qBMx9v1rmrw7@cluster0.vp53h.mongodb.net/", {
    dbName: "NodeJs_Trails"
}).then(() => {
    console.log(" Connected to MongoDB");
}).catch((err) => {
    console.log(" Error in connecting to MongoDB", err);
});

//  Define Routes

app.get('/', (req, res) => {
    res.render('login.ejs',);  //  Fixed incorrect template name
});

app.get('/register', (req, res) => {
    res.render('register.ejs',);  //  Fixed incorrect template name
});


//  Fixing Multer Storage Configuration
const storage = multer.diskStorage({ 
    destination: function (req, file, cb) {
        cb(null, 'public/upload'); 
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix);
    }
});

//  Initialize Multer
const upload = multer({ storage: storage });

const UserSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,

    filename: String,
    public_id: String,
    imgurl: String
})
const User = mongoose.model("User", UserSchema);

// Route to Upload Image
app.post('/register', upload.single('register'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send("No file uploaded!");
        }

        //  Use absolute file path for Cloudinary upload
        const filePath = path.resolve(req.file.path);
        const {name, email, password } = req.body;

        // Upload to Cloudinary
        const cloudinaryRes = await cloudinary.uploader.upload(filePath, {
            folder: 'NodeJs_Trails'
        });

        // Creating User 
        const dbEntry = await User.create({
            name,
            email,
            password,

            filename: req.file.originalname,
            public_id: cloudinaryRes.public_id,
            imgurl: cloudinaryRes.secure_url
        });

        console.log("File saved to DB:", dbEntry);

        // Render UI with Uploaded Image URL and given details
      
        res.redirect('/');

    } catch (error) {
        console.error("Error uploading file:", error);
        res.status(500).send("Error uploading file");
    }
});


app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    let user = await User.findOne({ email }); // Changed 'User' to 'user'
    if (!user) res.render("login.ejs");
    else if (user.password !== password) {  // Fixed the comparison logic
        res.render("login.ejs");
    } else {
        res.render("profile.ejs", { user }); // Passed 'user' instead of 'User'
    }
});


//  Start Server

app.listen(port,() => {
    console.log(` Server running at http://localhost:${port}`);
});