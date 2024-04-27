require('dotenv').config(); // 載入並設定環境變數

const express = require('express');
const session = require('express-session');
const app = express();

const serverHTTP = process.env.SERVER_HTTP || 'http'; 
const serverIP = process.env.SERVER_IP || 'localhost'; // 取得伺服器位址，預設為 localhost
const serverPort = process.env.SERVER_PORT || 3000; // 取得伺服器端口，預設為 3000

app.use(session({ resave: true ,secret: '123456' , saveUninitialized: true}));

// 使用中介軟體解析請求主體
app.use(express.json());

// 設定路徑 /api/auth 的處理函式
app.use('/api/auth', require('./api/auth'));

// 啟動伺服器
app.listen(serverPort, serverIP, () => {
  console.log(`Server is running on ${serverHTTP}://${serverIP}:${serverPort}`);
});