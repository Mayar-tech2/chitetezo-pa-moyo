const processPayment = (amount, phone) => {
    return new Promise((resolve) => {
        console.log('Processing ' + amount + ' payment for ' + phone);
        resolve({ success: true, transactionId: 'MOB' + Date.now() });
    });
};

module.exports = { processPayment };
