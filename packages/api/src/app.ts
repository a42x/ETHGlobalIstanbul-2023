import express from 'express'
import cors from 'cors'
import { getContractAddress, getEncryptedProof, getNonceAndInitCode } from './helper'
import { Address, encodeFunctionData } from 'viem'
import { getPublicProvider } from './provider'
import { getNetwork } from './network'
import { abi as walletABI } from './Account.json'
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
    // const network = getNetwork(Number(chainId))
    // const publicClient = getPublicProvider(network)
    // const data = await getEncryptedProof(uid as string, BigInt(Number(index)), publicClient)
    // return res.status(200).send(data)
    res.send(
        'U2FsdGVkX1/qPtQv7Rq4a6dJPlItvOnaQ+KDVUnzKHnf9IO8yXHy7qtUywxQnBq3JQYBjP2Yf2OyLuUhWQilwUTIuuO5MSBkCQ++gY/c41hbBUwtyQrVeozQ+QNpfhRLlnIljoqivjjkjg9HK9XV2TEuUmQhbgpVSBAG4bWgOFR1oJJ7TzpwuO8AzuRFFE1KqUbbNVUbU/PGWr43ZuCM/2OZlJKYmQwalqAOMms4G3PwAxM9xVRdiKx3pIX04G6nIs4Bd0ixBxx06hB13WN/YPqM7O33tnvBQc2F71M2/eZIplvcrhXSHV0sDvLD+b9Y'
    )
})

app.post('/build', async (req, res) => {
    try {
        const { address, chainId, proof, uid } = req.body
        const chain = getNetwork(chainId)
        const provider = getPublicProvider(chain)

        const [nonce, initCode] = await getNonceAndInitCode(provider, address)

        // function verify(bytes32 _uuid, bytes32[] memory _leaves, bytes32[][] memory _proofs) public {}
        const callData = encodeFunctionData({
            abi: walletABI, // todo unicef contract abi
            functionName: 'verify',
            args: [uid, proof.leaves, proof.proofs]
        })

        const userOperationAndHash = await buildUserOperationAndHash(chain, address, nonce, callData, initCode)

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
        const { userOperation, chainId } = req.body
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
