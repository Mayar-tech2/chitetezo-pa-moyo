app.post('/ussd', (req, res) => {
  const { phoneNumber, text } = req.body;
  let response;
  
  if (text === '') {
    // Initial menu
    response = 'CON Welcome to Chitetezo:\n1. Register\n2. Check Status';
  } else if (text === '1') {
    // Registration flow
    response = 'CON Enter your full name:';
  } else if (text === '2') {
    // Status check
    response = 'END Your status is: Active';
  }
  
  res.send(response);
});