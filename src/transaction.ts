import SafeApiKit from '@safe-global/api-kit'
import Safe from '@safe-global/protocol-kit'
import {
    MetaTransactionData,
    OperationType
} from '@safe-global/safe-core-sdk-types'

import * as dotenv from 'dotenv';
dotenv.config();

async function main() {
    // Initialize the Protocol Kit with Owner A
    const protocolKitOwnerA = await Safe.init({
        provider: process.env.RPC_URL ?? "",
        signer: process.env.OWNER_A_PRIVATE_KEY ?? "",
        safeAddress: process.env.OWNER_A_SAFE_ADDRESS ?? "" ?? ""
    })

    // Create a Safe transaction
    const safeTransactionData: MetaTransactionData = {
        to: "0x3171E6f8263240F74A8f8769568C77784bb2dc3e",
        value: "1",
        data: '0x',
        operation: OperationType.Call
    }

    const safeTransaction = await protocolKitOwnerA.createTransaction({
        transactions: [safeTransactionData]
    })

    // Sign the transaction with Owner A
    const safeTxHash = await protocolKitOwnerA.getTransactionHash(safeTransaction)
    const signatureOwnerA = await protocolKitOwnerA.signHash(safeTxHash)

    // Initialize the API Kit
    const apiKit = new SafeApiKit({
        chainId: BigInt(13746)
    })

    // Send the transaction to the Transaction Service with the signature from Owner A
    await apiKit.proposeTransaction({
        safeAddress: process.env.OWNER_A_SAFE_ADDRESS ?? "" ?? "",
        safeTransactionData: safeTransaction.data,
        safeTxHash,
        senderAddress: process.env.OWNER_A_SAFE_ADDRESS ?? "" ?? "",
        senderSignature: signatureOwnerA.data
    })

    const signedTransaction = await apiKit.getTransaction(safeTxHash)

    // Initialize the Protocol Kit with Owner B
    const protocolKitOwnerB = await Safe.init({
        provider: process.env.RPC_URL ?? "",
        signer: process.env.OWNER_B_PRIVATE_KEY ?? "",
        safeAddress: process.env.OWNER_B_SAFE_ADDRESS ?? ""
    })

    // Sign the transaction with Owner B
    const signatureOwnerB = await protocolKitOwnerB.signHash(safeTxHash)

    // Send the transaction to the Transaction Service with the signature from Owner B
    await apiKit.confirmTransaction(
        safeTxHash,
        signatureOwnerB.data
    )

    const transactionResponse =
        await protocolKitOwnerA.executeTransaction(signedTransaction)
    console.log(transactionResponse)

    const transactions = await apiKit.getMultisigTransactions(process.env.OWNER_A_SAFE_ADDRESS ?? "")

    if (transactions.results.length > 0) {
        console.log('Last executed transaction', transactions.results[0])
    }

}


main().catch(console.error)

