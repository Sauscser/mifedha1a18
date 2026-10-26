/*
Use the following code to retrieve configured secrets from SSM:

const aws = require('aws-sdk');

const { Parameters } = await (new aws.SSM())
  .getParameters({
    Names: ["JuuIntegrationKey"].map(secretName => process.env[secretName]),
    WithDecryption: true,
  })
  .promise();

Parameters will be of the form { Name: 'secretName', Value: 'secretValue', ... }[]
*/
const AWS = require('aws-sdk');
const axios = require('axios');
const crypto = require('crypto');

const ssm = new AWS.SSM();
const JUU_API_URL = 'https://cdp3qcgyx9.execute-api.eu-north-1.amazonaws.com/v1/events';

exports.handler = async event => {
  if (!event.identity?.sub && !event.identity?.username) {
    return { success: false, message: 'An authenticated user is required.' };
  }

  const amount = Number(event.arguments?.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, message: 'The event amount must be a positive number in KES.' };
  }

  const productId = process.env.JUU_PRODUCT_ID;
  const secretParameterName = process.env.JuuIntegrationKey;
  if (!productId || !secretParameterName) {
    return { success: false, message: 'Juu product ID or integration secret is not configured.' };
  }

  try {
    const { Parameters = [], InvalidParameters = [] } = await ssm.getParameters({
      Names: [secretParameterName],
      WithDecryption: true
    }).promise();
    const integrationKey = Parameters.find(parameter => parameter.Name === secretParameterName)?.Value;
    if (!integrationKey || InvalidParameters.includes(secretParameterName)) {
      throw new Error('Juu integration secret is missing from AWS Systems Manager Parameter Store.');
    }

    const response = await axios.post(JUU_API_URL, {
      contractVersion: 6,
      eventId: crypto.randomUUID(),
      eventType: 'nisenti_full_payment_online_purchase',
      occurredAt: new Date().toISOString(),
      productId,
      fields: { amount }
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-uppy-api-key': integrationKey
      },
      timeout: 10000,
      validateStatus: status => status === 202
    });

    return {
      success: true,
      message: `Juu accepted the event (HTTP ${response.status}).`
    };
  } catch (error) {
    const status = error.response?.status;
    console.error('Juu full-payment event delivery failed:', {
      status,
      code: error.code,
      message: error.message
    });
    return {
      success: false,
      message: status
        ? `Juu rejected the event (HTTP ${status}).`
        : `Juu event delivery failed: ${error.message}`
    };
  }
};
