import express from 'express'
import cors from 'cors'
import { getContractAddress } from './helper'
import { Address } from 'viem'
import { getPublicProvider } from './provider'
import { getNetwork } from './network'

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

app.get('/address', async (req, res) => {
    const { owner, chainId } = req.query
    const network = getNetwork(Number(chainId))
    const publicClient = getPublicProvider(network)
    const address = await getContractAddress(owner as Address, 42n, publicClient)
    res.json({ address })
})

app.get('/balance', async (req, res) => {
    const { address, chainId } = req.query
    const network = getNetwork(Number(chainId))
    const publicClient = getPublicProvider(network)
    const balance = await publicClient.getBalance({ address: address as Address })
    res.json({ balance })
})

app.listen(8080, () => {
    console.log('Server is running on port 8080')
})
