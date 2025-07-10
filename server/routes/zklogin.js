const express = require('express');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const router = express.Router();

// Path to file for storing salt data
const saltDataPath = path.join(__dirname, '..', 'data', 'zklogin-salts.json');

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, '..', 'data');
fs.ensureDirSync(dataDir);

// Read salt data from file
const readSaltData = () => {
  try {
    if (fs.existsSync(saltDataPath)) {
      const data = fs.readFileSync(saltDataPath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  } catch (error) {
    console.error('Error reading salt data:', error);
    return [];
  }
};

// Write salt data to file
const writeSaltData = (data) => {
  try {
    fs.writeFileSync(saltDataPath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing salt data:', error);
    return false;
  }
};

// GET /api/zklogin/salt/generate - generate new salt for user
router.get('/salt/generate', async (req, res) => {
  try {
    const { jwt } = req.query;

    if (!jwt) {
      return res.status(400).json({ error: 'jwt is required' });
    }

    // Decode JWT token to get payload
    const jwtParts = jwt.split('.');
    if (jwtParts.length !== 3) {
      return res.status(400).json({ error: 'Invalid JWT format' });
    }
    
    // Decode payload (second part of JWT)
    const payload = JSON.parse(Buffer.from(jwtParts[1], 'base64').toString());
    
    // Extract email from payload
    const iss = payload.iss;
    if (iss !== 'https://accounts.google.com') {
      return res.status(400).json({ error: 'JWT is not from Google' });
    }

    const sub = payload.sub;
    const saltData = readSaltData();

    // Check if salt already exists for this user
    const recordSaltData = saltData.find(item => item.sub === sub && item.iss === iss);
    
    if (recordSaltData) {
      console.log('Salt already exists for user:', recordSaltData.userAddress);
      return res.json({
        success: true,
        salt: recordSaltData.salt,
        userAddress: recordSaltData.userAddress, 
        publicKey: recordSaltData.publicKey,         
        message: 'Salt already exists for this user',
        saltInfo: {
          id: recordSaltData.id,
          iss: recordSaltData.provider,
          sub: recordSaltData.provider,
          createdAt: recordSaltData.createdAt,
          updatedAt: recordSaltData.updatedAt
        }
      });
    }

    const response = await fetch(`${process.env.ENOKI_API_BASE_URL}/zklogin`, {
      headers: {
        "zklogin-jwt": jwt,
        "Authorization": `Bearer ${process.env.ENOKI_TOKEN}`
      }
    });

    console.log(response);
    const responseData = await response.json();
    const userAddress = responseData.data.address;        
    
    // Generate new salt
    const salt = responseData.data.salt;
    const publicKey = responseData.data.publicKey;
    const saltId = uuidv4();
    
    const newRecordSaltData = {
      id: saltId,
      iss: iss,
      sub: sub,      
      userAddress: userAddress,
      salt: salt,
      publicKey: publicKey,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saltData.push(newRecordSaltData);
    
    if (writeSaltData(saltData)) {
      console.log('Salt generated successfully for user:', userAddress);
      res.json({
        success: true,
        salt: salt,
        userAddress: newRecordSaltData.userAddress, 
        publicKey: newRecordSaltData.publicKey, 
        message: 'Salt generated successfully',
        saltInfo: {
          iss: newRecordSaltData.iss,
          sub: newRecordSaltData.sub,
          createdAt: newRecordSaltData.createdAt,
          updatedAt: newRecordSaltData.updatedAt
        }
      });
    } else {
      res.status(500).json({ error: 'Error saving salt' });
    }
  } catch (error) {
    console.error('Error generating salt:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/zklogin/proof - generate new proof from jwt, keypair, maxEpoch, randomness
router.post('/proof', async (req, res) => {
  try {

    const { jwt, ephemeralPublicKey, maxEpoch, randomness, network } = req.body;

    //TO DO: check jwt is valid, not expired and other security checks for unauthenticated request

   const proofResponse = await fetch(`${process.env.ENOKI_API_BASE_URL}/zklogin/zkp`, {
    method: 'POST',
    headers: {
      "zklogin-jwt": jwt,
      "Authorization": `Bearer ${process.env.ENOKI_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "network": network,
      "ephemeralPublicKey": ephemeralPublicKey,
      "maxEpoch": maxEpoch,
      "randomness": randomness
    })
  });

    const proofResponseData = await proofResponse.json();
    return res.json(proofResponseData);

  }
    catch (error) {
    console.error('Error get proof:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/zklogin/sponsor/create
router.post('/sponsor/create', async (req, res) => {
  try {

    const { jwt, payloadBytes, userAddress, network } = req.body;

   const sponsoredResponse = await fetch(`${process.env.ENOKI_API_BASE_URL}/transaction-blocks/sponsor`, {
      method: 'POST',
      headers: {
        "zklogin-jwt": jwt,
        "Authorization": `Bearer ${process.env.ENOKI_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        network: network,
        transactionBlockKindBytes: payloadBytes,
        sender: userAddress,
        // allowedAddresses: [
        //   "0x6b2e89a67fed30abd5278f57ac51a1f56bc85cff1661e1a9bea5a2e1ed651348"
        // ],
        // allowedMoveCallTargets: [
        //   "0x6b2e89a67fed30abd5278f57ac51a1f56bc85cff1661e1a9bea5a2e1ed651348::issuer::mint"
        // ]
      })
    });

    const sponsoredResponseData = await sponsoredResponse.json();
    return res.json(sponsoredResponseData);

  }
    catch (error) {
    console.error('Error create sponsored transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/zklogin/sponsor/execute
router.post('/sponsor/execute', async (req, res) => {
  try {

    const { digest, signature } = req.body;

   const sponsoredResponse = await fetch(`${process.env.ENOKI_API_BASE_URL}/transaction-blocks/sponsor/${digest}`, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${process.env.ENOKI_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        signature: signature
      })
    });

    const sponsoredResponseData = await sponsoredResponse.json();
    return res.json(sponsoredResponseData);

  }
    catch (error) {
    console.error('Error execute sponsored transaction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 