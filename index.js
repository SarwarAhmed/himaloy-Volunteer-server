const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
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

// verify jwt middleware
const verifyToken = (req, res, next) => {
    const token = req.cookies?.token
    if (!token) return res.status(401).send({ message: 'unauthorized access' })
    if (token) {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                console.log(err)
                return res.status(401).send({ message: 'unauthorized access' })
            }
            console.log(decoded)

            req.user = decoded
            next()
        })
    }
}


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
        const volunteerRequestCollection = client.db('himalayan').collection('volunteerRequest');

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
        });

        // get all posts from the database by specific email
        app.get('/my-posts/:eamil', verifyToken, async (req, res) => {
            const tokenEmail = req.user.email
            const email = req.user.email
            console.log(96, tokenEmail, email);

            if (tokenEmail !== email) return res.status(401).send({ message: 'Unauthorized Access' })

            const query = { 'user.email': email }
            const posts = await postCollection.find(query).toArray()
            res.send(posts)
        });


        app.post('/volunteerPost', async (req, res) => {
            const post = req.body
            console.log(post);
            const result = await postCollection.insertOne(post)
            res.send(result)
        });

        // get a single volunteer post by id
        app.get('/volunteer-post/:id', async (req, res) => {
            const id = req.params.id
            const post = await postCollection.findOne({ _id: new ObjectId(id) })
            console.log(post);
            res.send(post)
        });

        // upcomming six posts
        // upcoming Dates and Timestamps
        app.get('/upcommint-six-posts', async (req, res) => {
            const posts = await postCollection.find()
                .sort({ deadline: 1 })
                .limit(6).toArray()
            res.send(posts)
        });

        // upcomming three posts
        app.get('/upcommint-three-posts', async (req, res) => {
            const posts = await postCollection.find()
                .sort({ deadline: 1 })
                .limit(3).toArray()
            res.send(posts)
        });

        app.post('/volunteer-request', verifyToken, async (req, res) => {
            const volunteerRequest = req.body;
            const postId = volunteerRequest.postId;
            const post = await postCollection.findOne({ _id: new ObjectId(postId) });
            const noOfVolunteers = parseInt(post.numberOfVolunteers);
            console.log(post, noOfVolunteers);
            if (parseInt(noOfVolunteers) === 0) {
                return res.status(400).send({ message: 'No volunteer needed' });
            }

            const result = await volunteerRequestCollection.insertOne(volunteerRequest);
            await postCollection.updateOne({ _id: new ObjectId(postId) }, {
                $inc: { numberOfVolunteers: -1 }
            });
            res.send(result);
        });


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
