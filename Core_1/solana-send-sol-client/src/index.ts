import * as Web3 from '@solana/web3.js';
import * as fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

async function main() {
    const connection = new Web3.Connection(Web3.clusterApiUrl('devnet'));
    const signer = await initializeKeypair(connection);

    console.log("Public key:", signer.publicKey.toBase58());

    await sendSol(connection, 0.1, signer, Web3.Keypair.generate().publicKey);
}

async function sendSol(connection: Web3.Connection, amount: number, from: Web3.Keypair, to: Web3.PublicKey) {
    const transaction = new Web3.Transaction()
    const sendSolInstruction = Web3.SystemProgram.transfer({
        fromPubkey: from.publicKey,
        toPubkey: to,
        lamports: amount * Web3.LAMPORTS_PER_SOL
    })

    transaction.add(sendSolInstruction)
    const transactionSignature = await Web3.sendAndConfirmTransaction(connection, transaction, [from])

    console.log(
        `Transaction https://explorer.solana.com/tx/${transactionSignature}?cluster=devnet`
    )
}

async function initializeKeypair(connection: Web3.Connection): Promise<Web3.Keypair> {
    if (!process.env.PRIVATE_KEY) {
        console.log('Generating new keypair... 🗝️');
        const signer = Web3.Keypair.generate();

        console.log('Creating .env file');
        fs.writeFileSync('.env', `PRIVATE_KEY=[${signer.secretKey.toString()}]`)

        await airdropSolIfNeeded(signer, connection);

        return signer;
    }

    const secret = JSON.parse(process.env.PRIVATE_KEY ?? '') as number[];
    const secretKey = Uint8Array.from(secret);
    const keypairFromSecret = Web3.Keypair.fromSecretKey(secretKey);
    await airdropSolIfNeeded(keypairFromSecret, connection);
    return keypairFromSecret;
}

async function airdropSolIfNeeded(signer: Web3.Keypair, connection: Web3.Connection) {
    const balance = await connection.getBalance(signer.publicKey);
    console.log('Current balance is', balance / Web3.LAMPORTS_PER_SOL, 'SOL');

    // 1 SOL should be enough for almost anything you wanna do
    if (balance / Web3.LAMPORTS_PER_SOL < 1) {
        // You can only get up to 2 SOL per request 
        console.log('Airdropping 1 SOL');
        const airdropSignature = await connection.requestAirdrop(
            signer.publicKey,
            Web3.LAMPORTS_PER_SOL
        );

        const latestBlockhash = await connection.getLatestBlockhash();

        await connection.confirmTransaction({
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
            signature: airdropSignature,
        });

        const newBalance = await connection.getBalance(signer.publicKey);
        console.log('New balance is', newBalance / Web3.LAMPORTS_PER_SOL, 'SOL');
    }
}


main()
    .then(() => {
        console.log("Finished successfully")
        process.exit(0)
    })
    .catch((error) => {
        console.log(error)
        process.exit(1)
    })
