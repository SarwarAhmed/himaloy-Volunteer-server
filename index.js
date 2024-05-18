const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const app = express();

const corsOptions = {
    origin: [
        'http://localhost:5173',
        'https://himalayansa.firebaseapp.com',
    ],
    credentials: true,
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());




const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5mrfovz.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;



const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const postCollection = client.db('himalayan').collection('post');

        // JWT generation
        app.post('/jwt', (req, res) => {
            const user = req.body
            console.log(user);
            const token = jwt.sign(user, process.env.JWT_SECRET, {
                expiresIn: '7d'
            })

            res.cookie('token', token, {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 604800000
            }).send({ success: true })

            // res.cookie('token', token, {
            //     httpOnly: true,
            //     secure: process.env.NODE_ENV === 'production',
            //     sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict'
            // }).send({ success: true })
        })

        app.get('/logout', (req, res) => {
            res.clearCookie('token', {
                httpOnly: true,
                secure: true,
                sameSite: 'none',
                maxAge: 0
            }).send({ success: true })
        })

        app.post('/volunteerPost', async (req, res) => {
            const post = req.body
            console.log(post);
            const result = await postCollection.insertOne(post)
            res.send(result)
        })

        const VolunteerCollection = client.db('soloSphere').collection('post')
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello from solo!');
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
