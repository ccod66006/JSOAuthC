require('dotenv').config(); // 載入並設定環境變數
const {getTheToken} = require("./api/auth/token/client_credentials");
const axios = require('axios');
const { response } = require('express');
const { v4: uuidv4 } = require('uuid');

const FHIR_BASE_URL = ''; // 替換為實際的FHIR服務URL

var identifier_uuid = uuidv4().substring(0,20);
var access_token = ''; 
var headers = {};

async function createPatient() {
  const patient = {
    resourceType: 'Patient',
    id: uuidv4(), // 使用uuid生成唯一的Patient ID
    name: [{ given: ['MAMA'], family: 'Doe' }],
    gender: 'male',
    birthDate: '1990-01-01',
    identifier:[
      {
          use:"usual",
          system: "MITW_TEST_UUID",
          value: identifier_uuid
      }
  ]
  };
  console.log(patient);
  try {
    const response = await axios.post(`${FHIR_BASE_URL}/Patient?identifier=${identifier_uuid}`, patient, { headers });
    console.log('新增Patient成功：', response.data);
    return response.data;
  } catch (error) {
    console.log(response.data);
    console.error('新增Patient失敗：', error.message);
  }
}

async function updatePatient(patientId) {
  const updatedPatient = {
    resourceType: 'Patient',
    id: patientId,
    name: [{ given: ['PIZZA'], family: 'ABC' }], // 修改姓氏
    gender: 'male',
    birthDate: '1990-01-01',
    identifier:[
      {
          use:"usual",
          system: "MITW_TEST_UUID",
          value: identifier_uuid
      }
    ]
  };

  try {
    const response = await axios.put(`${FHIR_BASE_URL}/Patient/${patientId}`, updatedPatient, { headers });
    console.log('修改Patient成功：', response.data);
    return response.data.entry;
  } catch (error) {
    console.error('修改Patient失敗：', error.message);
  }
}

async function readAllPatients() {
  try {
    const response = await axios.get(`${FHIR_BASE_URL}/Patient`, { headers });
    console.log('所有Patient：', response.data);
    return response.data.entry;
  } catch (error) {
    console.log(response.data);
    console.error('讀取Patient失敗：', error.message);
  }
}
async function searchPatientByIdentifier(identifier) {
  try {
    const response = await axios.get(`${FHIR_BASE_URL}/Patient?identifier=${identifier}`, { headers });
    console.log('符合條件的Patient：', response.data);
    return response.data;
  } catch (error) {
    console.error('查詢Patient失敗：', error.message);
  }
}

async function deletePatient(patientId) {
  try {
    const response = await axios.delete(`${FHIR_BASE_URL}/Patient/${patientId}`, { headers });
    console.log('刪除Patient成功：', response.status);
  } catch (error) {
    console.error('刪除Patient失敗：', error.message);
  }
}

async function main() {
  access_token = await getTheToken();
  console.log(access_token);
  headers = {
    Authorization: `Bearer ${access_token}`,
    hospIp: '123',
    userId: 'abc',
  };
  await searchPatientByIdentifier(); 
  const newPatient = await createPatient();
  if (newPatient) {
    await searchPatientByIdentifier(identifier_uuid);
    const updatedPatient = await updatePatient(newPatient.id);
    if (updatedPatient) {
      await searchPatientByIdentifier(identifier_uuid);
      //await deletePatient(updatedPatient.id);
      //await searchPatientByIdentifier(identifier_uuid); // 再次讀取確認是否已刪除
    }
  }
}

main();


