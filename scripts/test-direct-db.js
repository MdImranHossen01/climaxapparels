const mongoose = require('mongoose');

const uri = 'mongodb://ClimaxApparels:7QAHPIpeh0oR4bvN@ac-jrowhop-shard-00-00.e5n1hnl.mongodb.net:27017,ac-jrowhop-shard-00-01.e5n1hnl.mongodb.net:27017,ac-jrowhop-shard-00-02.e5n1hnl.mongodb.net:27017/ClimaxApparels?ssl=true&replicaSet=atlas-qnqnrr-shard-0&authSource=admin&retryWrites=true&w=majority';

console.log('Connecting via direct connection string...');
mongoose.connect(uri)
  .then(() => {
    console.log('Connection successful!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection failed:', err);
    process.exit(1);
  });
