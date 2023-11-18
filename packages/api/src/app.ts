import express from 'express'
import cors from 'cors'
import { getContractAddress, getEncryptedLeaf, getEncryptedProof, getNonceAndInitCode } from './helper'
import { Address, encodeFunctionData } from 'viem'
import { getPublicProvider } from './provider'
import { getNetwork } from './network'
import { abi as walletABI } from './Account.json'
import unicefABI from './Unicef.json'
import { buildUserOperationAndHash, sendUserOperationToBundler } from './userOperationHelper'

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

app.get('/proof', async (req, res) => {
    const { chainId, uid, index } = req.query
    const network = getNetwork(Number(chainId))
    const publicClient = getPublicProvider(network)
    const proof = await getEncryptedProof(uid as string, BigInt(Number(index)), publicClient)
    const leaf = await getEncryptedLeaf(uid as string, BigInt(Number(index)), publicClient)
    return res.status(200).json({ proof, leaf })
})

app.post('/build', async (req, res) => {
    try {
        const { owner, chainId, uid, fundId, dataIndices, leaves, proofs } = req.body
        const chain = getNetwork(chainId)
        const provider = getPublicProvider(chain)
        const network = getNetwork(Number(chainId))
        const publicClient = getPublicProvider(network)
        const address = await getContractAddress(owner as Address, 42n, publicClient)

        const [nonce, initCode] = await getNonceAndInitCode(provider, owner)

        const callData = encodeFunctionData({
            abi: unicefABI, // todo unicef contract abi
            functionName: 'verify',
            args: [fundId, uid, dataIndices, leaves, proofs]
        })

        // const callData = '0x'

        const uoCallData = encodeFunctionData({
            abi: walletABI,
            functionName: 'execute',
            args: ['todo deployed unicef contract', 0, callData]
        })

        const userOperationAndHash = await buildUserOperationAndHash(chain, address, nonce, uoCallData, initCode)

        const resp = {
            userOperation: userOperationAndHash.userOperation,
            userOpHash: userOperationAndHash.userOpHash
        }
        res.json(resp)
    } catch (e) {
        console.log(e)
        res.status(500).json({ error: 'error' })
    }
})

app.post('/send', async (req, res) => {
    try {
        const { userOperation } = req.body
        const chainId = 11155111 //todo
        const chain = getNetwork(chainId)

        const result = await sendUserOperationToBundler(chain, userOperation, true)
        const resp = {
            userOpHash: result.userOpHash,
            transactionHash: result.transactionHash
        }
        console.log(resp)
        return res.json(resp)
    } catch (e) {
        console.log(e)
        res.status(500).json({ error: 'error' })
    }
})

app.listen(8080, () => {
    console.log('Server is running on port 8080')
})
