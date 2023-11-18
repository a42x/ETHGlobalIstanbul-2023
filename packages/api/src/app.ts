import express from 'express'
import cors from 'cors'

const app: express.Express = express()

app.use(cors())
app.use(express.json())
app.use((req, _res, next) => {
    console.log('Request URL:', req.originalUrl)
    console.log('Request Type:', req.method)
    console.log('Request Header: ', JSON.stringify(req.headers))
    console.log('Request Query:', JSON.stringify(req.query))
    console.log('Request Body: ', JSON.stringify(req.body))
    next()
})

app.get('/', (_req, res) => {
    res.send('Hello World!')
})

app.listen(8080, () => {
    console.log('Server is running on port 8080')
})
