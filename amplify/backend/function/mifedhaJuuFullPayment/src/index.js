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

const redactSensitiveData = value => {
  if (Array.isArray(value)) {
    return value.map(redactSensitiveData);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, entry]) => [
      key,
      /authorization|api.?key|secret|token|password/i.test(key)
        ? '[REDACTED]'
        : redactSensitiveData(entry)
    ]));
  }
  if (typeof value === 'string') {
    return value.replace(/juu_live_[A-Za-z0-9_-]+/gi, '[REDACTED]');
  }
  return value;
};

exports.handler = async event => {
  if (!event.identity?.sub && !event.identity?.username) {
    return { success: false, message: 'An authenticated user is required.' };
  }

  const isGroupRegistration = event.info?.fieldName === 'recordJuuGroupRegistrationEvent';
  const numberOfGroups = Number(event.arguments?.numberOfGroups);
  const amount = Number(event.arguments?.amount);
  if (isGroupRegistration) {
    if (!Number.isInteger(numberOfGroups) || numberOfGroups <= 0) {
      return { success: false, message: 'The number of groups must be a positive integer.' };
    }
  } else if (!Number.isFinite(amount) || amount <= 0) {
    return { success: false, message: 'The event amount must be a positive number in KES.' };
  }

  const location = event.arguments?.location;
  if (
    !location
    || typeof location !== 'object'
    || !Number.isFinite(location.latitude)
    || location.latitude < -90
    || location.latitude > 90
    || !Number.isFinite(location.longitude)
    || location.longitude < -180
    || location.longitude > 180
  ) {
    return { success: false, message: 'Valid latitude and longitude are required for the Juu event.' };
  }

  const contractVersion = isGroupRegistration ? 7 : 6;
  const eventType = isGroupRegistration
    ? 'kenyan_self_help_groups'
    : 'nisenti_full_payment_online_purchase';
  const productId = isGroupRegistration
    ? process.env.JUU_GROUP_PRODUCT_ID
    : process.env.JUU_PRODUCT_ID;
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

    const eventId = crypto.randomUUID();
    const fields = isGroupRegistration ? { number_of_groups: numberOfGroups } : { amount };
    const response = await axios.post(JUU_API_URL, {
      contractVersion,
      eventId,
      eventType,
      occurredAt: new Date().toISOString(),
      productId,
      location,
      fields
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
    const responseBody = error.response?.data;
    const safeResponseBody = redactSensitiveData(responseBody);
    const responseBodyForLog = typeof safeResponseBody === 'string'
      ? safeResponseBody.slice(0, 2000)
      : JSON.stringify(safeResponseBody)?.slice(0, 2000);
    console.error('Juu event delivery failed:', {
      status,
      code: error.code,
      message: error.message,
      responseRequestId: error.response?.headers?.['x-amzn-requestid']
        || error.response?.headers?.['x-amz-apigw-id'],
      responseBody: responseBodyForLog,
      event: {
        contractVersion,
        eventType,
        fields: isGroupRegistration ? { number_of_groups: numberOfGroups } : { amount },
        productId,
        location
      }
    });
    return {
      success: false,
      message: status
        ? `Juu rejected the event (HTTP ${status}).`
        : `Juu event delivery failed: ${error.message}`
    };
  }
};
