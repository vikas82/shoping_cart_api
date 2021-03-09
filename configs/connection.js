var constent =  require('./constent');
const Sequelize = require('sequelize');



const sequelize = new Sequelize(DATABASE, USERNAME, PASSWORD, {
    host: HOST,
    dialect: dialect,
    port: PORT,
    //operatorsAliases: false
  });
  
  const db = {};
  
  db.Sequelize = Sequelize;
  db.sequelize = sequelize;

  module.exports = db;


