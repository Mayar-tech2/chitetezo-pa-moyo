const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = 3001;
const BACKEND_URL = 'http://localhost:5000/api/ussd';

let sessionId = '';
let userPhone = '+265888123456'; // Test Malawi number

app.post('/simulate', async (req, res) => {
  try {
    const { input } = req.body;
    
    const response = await axios.post(BACKEND_URL, {
      sessionId: sessionId || `sim_${Date.now()}`,
      serviceCode: '*384*456#',
      phoneNumber: userPhone,
      text: input
    });
    
    sessionId = response.data.sessionId || sessionId;
    res.send(response.data);
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).send({ error: 'Simulation failed' });
  }
});

app.listen(PORT, () => {
  console.log(`USSD simulator running on port ${PORT}`);
  console.log(`Test endpoint: POST http://localhost:${PORT}/simulate`);
});