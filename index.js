const express = require('express')
const cors = require('cors')
const axios = require('axios')

const app = express()

app.use(express.urlencoded({extended: true}))
app.use(cors())

app.get('/photos', async (req, res) => {
    const albumId = req.query.albumId
    const { data } = await axios.get(
        "https://jsonplaceholder.typicode.com/photos",
        { params: { albumId } }
    )

    res.json(data)
})

app.get('/photos/:id', async (req, res) => {
    const { data } = await axios.get(
        `https://jsonplaceholder.typicode.com/photos/${req.params.id}`
    )

    res.json(data)
})


app.listen(3000, () => console.log('listening on http://localhost:3000'))