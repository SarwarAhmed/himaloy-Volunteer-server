const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
const cookieParser = require('cookie-parser');
require('dotenv').config();
const port = process.env.PORT || 5000;
const jwt = require('jsonwebtoken')
const app = express();

const corsOptions = {
    origin: ['http://localhost:5173'],
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

        const VolunteerCollection = client.db('soloSphere').collection('post')

        // jwt generate
        app.post('/jwt', async (req, res) => {
            const email = req.body
            const token = jwt.sign(email, process.env.JWT_SECRET, {
                expiresIn: '365d',
            })
            res
                .cookie('token', token, {
                    httpOnly: true,
                    // secure: process.env.NODE_ENV === 'production',
                    // sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                    secure: true,
                    sameSite: 'None',
                })
                .send({ success: true })
        })

        // Clear token on logout
        app.get('/logout', (req, res) => {
            res
                .clearCookie('token', {
                    httpOnly: true,
                    // secure: process.env.NODE_ENV === 'production',
                    // sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                    secure: true,
                    sameSite: 'None',
                    maxAge: 0,
                })
                .send({ success: true })
        })


        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();
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
