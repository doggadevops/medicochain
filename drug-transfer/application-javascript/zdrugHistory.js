'use strict';

const { Gateway, Wallets } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const path = require('path');
const { buildCAClient, registerAndEnrollUser, enrollAdmin } = require('../../utils/CAUtil.js');
const { buildCCPManufacturer, buildWallet } = require('../../utils/AppUtil.js');
const Drug = require('../chaincode-javascript/lib/drug')


const channelName = 'medicochainchannel';
const chaincodeName = 'basic';
const mspOrg1 = 'ManufacturerMSP';
const walletPath = path.join(__dirname, 'wallet');
const org1UserId = 'appUser44';

function prettyJSONString(inputString) {
    return JSON.stringify(JSON.parse(inputString), null, 2);
}

async function main(
    manufacturer,
    drugNumber,
) {
    try {
        // build an in memory object with the network configuration (also known as a connection profile)
        const ccp = buildCCPManufacturer();

        // // setup the wallet to hold the credentials of the application user
        const wallet = await buildWallet(Wallets, walletPath);

        const gateway = new Gateway();

        try {
            await gateway.connect(ccp, {
                wallet,
                identity: org1UserId,
                discovery: { enabled: true, asLocalhost: true } // using asLocalhost as this gateway is using a fabric network deployed locally
            });

            // Build a network instance based on the channel where the smart contract is deployed
            const network = await gateway.getNetwork(channelName);

            // Get the contract from the network.
            const contract = network.getContract(chaincodeName);

            const getDrugHistoryResponse = await contract.submitTransaction(
                'getDrugHistory',
                manufacturer,
                drugNumber
            );
            let drugHistory = Drug.fromBuffer(getDrugHistoryResponse);
            return drugHistory;
        } catch (error) {
            console.log(`Error processing transaction. ${error}`);
            console.log(error.stack);
            throw error;

        } finally {
            // Disconnect from the gateway when the application is closing
            // This will close all connections to the network
            gateway.disconnect();
        }
    } catch (error) {
        console.error(`******** FAILED to run the application: ${error}`);
        throw error;
    }
}

module.exports.execute = main;