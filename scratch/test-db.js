const mongoose = require('mongoose');

const directUri = 'mongodb://HillVictor:xI2QuBaFZsYQ5vRD@ac-jrowhop-shard-00-00.e5n1hnl.mongodb.net:27017,ac-jrowhop-shard-00-01.e5n1hnl.mongodb.net:27017,ac-jrowhop-shard-00-02.e5n1hnl.mongodb.net:27017/HillVictor?ssl=true&authSource=admin';

console.log('Connecting to MongoDB directly...');
mongoose.connect(directUri)
  .then(() => {
    console.log('Success!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Failed:', err);
    process.exit(1);
  });
