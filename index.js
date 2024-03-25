const express = require('express')
const cors = require('cors')
const axios = require('axios')
const Redis = require('redis')

const DEFAULT_EXPIRATION = 3600

const redisClient = Redis.createClient() // pass { url: <prod url here> } on production 
redisClient.connect().then(() => {
    const app = express()

    app.use(express.urlencoded({extended: true}))
    app.use(cors())

    app.get('/photos', async (req, res) => {
        const albumId = req.query.albumId
        const photos = await getOrSetCache(`photos?albumId=${albumId}`, async () => {
            const { data } = await axios.get(
                "https://jsonplaceholder.typicode.com/photos",
                { params: { albumId } }
            )
            return data
        })

        res.json(photos)
    })

    app.get('/photos/:id', async (req, res) => {

        const photo = await getOrSetCache(`photo:${req.params.id}`, async () => {
            const { data } = await axios.get(
                `https://jsonplaceholder.typicode.com/photos/${req.params.id}`
            )
            console.log(data, 'data from /photos/id');
            return data
        })

        console.log('response data photo');
        res.json(photo)
    })

    app.listen(3000, () => console.log('listening on http://localhost:3000'))

})


async function getOrSetCache(key, cb) {
    console.log('getOrSetCache invoked');

    try {
        // Use asyncGet instead of await redisClient.get
        console.log(key, 'key');
        const data = await redisClient.get(key)
        
        if (data !== null) {
            console.log('Data exists in Redis :)');
            return JSON.parse(data);
        }

        console.log('Oops!, cache is not available');
        
        // If data doesn't exist in Redis, call cb to get fresh data
        const freshData = await cb();
        
        // Set the fresh data in Redis
        redisClient.setEx(key, DEFAULT_EXPIRATION, JSON.stringify(freshData))
        
        return freshData;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

