const express = require('express')
const cors = require('cors')
const axios = require('axios')
const Redis = require('redis')

const app = express()
const redisClient = Redis.createClient() // pass { url: <prod url here> } on production 

const DEFAULT_EXPIRATION = 3600

app.use(express.urlencoded({extended: true}))
app.use(cors())

app.get('/photos', async (req, res) => {
    const albumId = req.query.albumId
    await redisClient.connect()
    const photos = getOrSetCache(`photos?albumId${albumId}`, async () => {
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
        return data
    })

    res.json(photo)
})

function getOrSetCache(key, cb) {
    return new Promise ((resolve, reject) => {
        redisClient.get(key, async (error, data) => {
            console.log('inside callback');
            if (error) return reject(error)
            if (data != null) return resolve(JSON.parse(data))
            console.log('Oops!, cache is not available');
            const freshData = await cb()
            redisClient.setEx(key, DEFAULT_EXPIRATION, JSON.stringify(freshData))
            resolve(freshData)
        })
    }) 
}


app.listen(3000, () => console.log('listening on http://localhost:3000'))