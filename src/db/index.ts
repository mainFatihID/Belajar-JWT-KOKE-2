import mysql from 'mysql2/promise';

const pool = await mysql.createConnection({
  host      : 'localhost',
  user      : 'root',
  password  : 'Output0-Matador6-Abdomen9-Graph3-Curtly7-Mustang0-Second5-Demanding9',
  database  : 'db_express_playground',
});

export default pool