/* Amplify Params - DO NOT EDIT
	API_MIFEDHA1A_GRAPHQLAPIIDOUTPUT
	API_MIFEDHA1A_LAONREPAYMENTNOTIFICATIONTABLE_ARN
	API_MIFEDHA1A_LAONREPAYMENTNOTIFICATIONTABLE_NAME
	ENV
	REGION
Amplify Params - DO NOT EDIT */

/**
 * @type {import('@types/aws-lambda').APIGatewayProxyHandler}
 */

const AWS = require('aws-sdk');
const axios = require('axios');
const dynamoDB = new AWS.DynamoDB.DocumentClient();
const secretsManager = new AWS.SecretsManager();

// Helper: Get Firebase credentials from Secrets Manager
async function getFirebaseCredentials() {
    const secretName = "MiFedhaRidesKey";
    const data = await secretsManager.getSecretValue({ SecretId: secretName }).promise();
    if ('SecretString' in data) {
        return JSON.parse(data.SecretString);
    } else {
        const buff = Buffer.from(data.SecretBinary, 'base64');
        return JSON.parse(buff.toString('ascii'));
    }
}

// Helper: Send FCM notification using HTTP v1 API
async function sendFCM(firebaseCreds, fcmToken, title, body) {
    console.log('DEBUG_FIREBASE_CREDS', JSON.stringify(firebaseCreds));
    const projectId = firebaseCreds.project_id;
    const privateKey = firebaseCreds.private_key.replace(/\\n/g, '\n');
    const clientEmail = firebaseCreds.client_email;
    // Generate JWT for FCM
    const jwt = require('jsonwebtoken');
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: clientEmail,
        sub: clientEmail,
        aud: 'https://oauth2.googleapis.com/token',
        iat: now,
        exp: now + 3600,
        scope: 'https://www.googleapis.com/auth/firebase.messaging'
    };
    const token = jwt.sign(payload, privateKey, { algorithm: 'RS256' });
    // Get access token
    const { data } = await axios.post('https://oauth2.googleapis.com/token', {
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: token
    });
    const accessToken = data.access_token;
    // Send notification
    await axios.post(
        `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`,
        {
            message: {
                token: fcmToken,
                notification: { title, body }
            }
        },
        { headers: { Authorization: `Bearer ${accessToken}` } }
    );
}


// Helper: Create in-app message via AppSync GraphQL mutation
const crypto = require('crypto');
async function createInAppMessage(userEmail, messageBody) {
    const endpoint = "https://w3grdoedrjbonhgvozu2xtbexa.appsync-api.us-east-1.amazonaws.com/graphql";
    const apiKey = "da2-igpwda2eqnb7zhzzna5wxcij4a";
    const mutation = `mutation CreateMessages($input: CreateMessagesInput!) {\n  createMessages(input: $input) { id senderEmail messageBody createdAt }\n}`;
    const id = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    const createdAt = new Date().toISOString();
    const input = {
        id,
        senderEmail: userEmail,
        messageBody,
        createdAt
    };
    await axios.post(
        endpoint,
        {
            query: mutation,
            variables: { input }
        },
        { headers: { 'x-api-key': apiKey } }
    );
}

const { fetchLoanDetails } = require('./loanUtils');
exports.handler = async (event) => {
    const tableName = process.env.API_MIFEDHA1A_LAONREPAYMENTNOTIFICATIONTABLE_NAME;
    const today = Date.now(); // timestamp in ms
    let notificationsSent = 0;
    try {
        // 1. Query for due notifications (sent: false, dueDate <= today)
        const scanParams = {
            TableName: tableName,
            FilterExpression: '#sent = :s AND #dueDate <= :d',
            ExpressionAttributeNames: { '#sent': 'sent', '#dueDate': 'dueDate' },
            ExpressionAttributeValues: { ':s': false, ':d': today }
        };
        const result = await dynamoDB.scan(scanParams).promise();
        if (!result.Items || result.Items.length === 0) {
            return { statusCode: 200, body: JSON.stringify('No due notifications.') };
        }
        // 2. Get Firebase credentials
        const firebaseCreds = await getFirebaseCredentials();
        // 3. Process each notification
        // Notification cycle order
        const notificationCycle = [
            'two thirds',
            'middle day',
            'last day but one',
            'last day'
        ];
        for (const notif of result.Items) {
            try {
                // Fetch FCM token (assume stored in notif.fcmToken or fetch from user table)
                const fcmToken = notif.fcmToken || notif.firebaseKey;
                if (!fcmToken) continue;
                // Fetch latest loan details using loanType
                const loan = await fetchLoanDetails(notif.loanId, notif.loanType);
                if (!loan) continue;
                // Calculate next due date in the payment cycle
                let nextDueDateDisplay = '';
                if (loan.crtnDate && loan.paymentFrequency) {
                    const paymentFrequency = Number(loan.paymentFrequency);
                    const crtnDate = Number(loan.crtnDate);
                    const now = Date.now();
                    // How many cycles have elapsed since creation?
                    const cyclesElapsed = Math.floor((now - crtnDate) / (paymentFrequency * 24 * 60 * 60 * 1000));
                    // Next due date is at the next cycle
                    const nextDueDate = crtnDate + (cyclesElapsed + 1) * paymentFrequency * 24 * 60 * 60 * 1000;
                    const nextDueDateObj = new Date(nextDueDate);
                    // Format as '4th September 2026'
                    const day = nextDueDateObj.getDate();
                    const month = nextDueDateObj.toLocaleString('default', { month: 'long' });
                    const year = nextDueDateObj.getFullYear();
                    // Add ordinal suffix to day
                    function ordinal(n) {
                        const s = ["th", "st", "nd", "rd"], v = n % 100;
                        return n + (s[(v - 20) % 10] || s[v] || s[0]);
                    }
                    nextDueDateDisplay = `${ordinal(day)} ${month} ${year}`;
                }
                // Calculate days elapsed since crtnDate (assume crtnDate is a timestamp in ms)
                const today = Date.now();
                let crtnDate = loan.crtnDate;
                if (!crtnDate) {
                    // fallback: try createdAt as ISO string
                    crtnDate = loan.createdAt ? Date.parse(loan.createdAt) : null;
                }
                let daysElapsed = 0;
                if (crtnDate) {
                    daysElapsed = (today - crtnDate) / (1000 * 60 * 60 * 24);
                }
                const amountExpectedBack = Number(loan.amountExpectedBack) || 0;
                const amountRepaid = Number(loan.amountRepaid) || 0;
                const interest = Number(loan.interest) || 0;
                const netLnBal = amountExpectedBack - amountRepaid;
                // Daily compounding interest (per annum)
                const lonBalance = netLnBal * Math.pow(1 + interest / 36500, daysElapsed);
                // Only send notification if lonBalance > 0
                if (lonBalance <= 0) {
                    // Optionally set sent=true to stop further notifications
                    await dynamoDB.update({
                        TableName: tableName,
                        Key: { id: notif.id },
                        UpdateExpression: 'set #sent = :s',
                        ExpressionAttributeNames: { '#sent': 'sent' },
                        ExpressionAttributeValues: { ':s': true }
                    }).promise();
                    continue;
                }
                // Compose message: show loaner/seller name from loan record
                // Map loanType codes to user-friendly names
                // Map loanType from notification to user-friendly name for title
                let notifLoanType = notif.loanType || 'Loan';
                let loanTypeLabel = notifLoanType;
                if (notifLoanType === 'GrpLn') {
                    loanTypeLabel = 'Group Loan';
                } else if (notifLoanType === 'Biz2Biz' || notifLoanType === 'CredSlr') {
                    loanTypeLabel = 'Credit Sale Debt';
                } else if (notifLoanType === 'SMLoan') {
                    loanTypeLabel = 'Pal Loan';
                }
                const loanId = loan.loanID || notif.loanId;
                // Use correct loaner name field from loan record for body
                let loanerName = 'Lender';
                if (notifLoanType === 'GrpLn' && loan.LoanerName) {
                    loanerName = loan.LoanerName;
                } else if ((notifLoanType === 'Biz2Biz' || notifLoanType === 'CredSlr') && loan.SellerName) {
                    loanerName = loan.SellerName;
                } else if (notifLoanType === 'SMLoan' && loan.loanername) {
                    loanerName = loan.loanername;
                } else if (loan.loanerName) {
                    loanerName = loan.loanerName;
                }
                const title = `${loanTypeLabel} Repayment Due`;
                // Format loan balance and installment amount for message
                const formattedBalance = lonBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                const installmentAmount = loan.installmentAmount ? Number(loan.installmentAmount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : 'N/A';
                const loaneeName = loan.loaneeName || loan.loaneename || 'User';
                const greeting = `Hi ${loaneeName},`;
                const body = `${greeting}\nYou have a ${loanTypeLabel} (ID: ${loanId}) repayment due to ${loanerName}.\nLoan Balance: ${formattedBalance} KES\nInstallment Amount: ${installmentAmount} KES` + (nextDueDateDisplay ? `\nPay before: ${nextDueDateDisplay}` : '') + `\nPlease go to NiSenti and pay your installment, make a partial repayment, or pay in full.`;
                // Send FCM notification
                await sendFCM(firebaseCreds, fcmToken, title, body);
                // Create in-app message
                await createInAppMessage(notif.userId, body);
                // Determine next notificationType and dueDate
                let currentType = notif.notificationType || notificationCycle[0];
                let idx = notificationCycle.indexOf(currentType);
                if (idx === -1) idx = 0;
                let nextIdx = idx + 1;
                let nextType = notificationCycle[nextIdx] || notificationCycle[0];
                let nextDueDate;
                const now = notif.dueDate ? Number(notif.dueDate) : Date.now();
                const paymentFrequency = loan.paymentFrequency || 7; // fallback 7 days
                if (currentType === 'last day but one') {
                    nextDueDate = now + 1 * 24 * 60 * 60 * 1000;
                } else if (currentType === 'last day' || currentType === 'first day') {
                    nextDueDate = now + (2/3) * paymentFrequency * 24 * 60 * 60 * 1000;
                } else {
                    // Default: add paymentFrequency days
                    nextDueDate = now + paymentFrequency * 24 * 60 * 60 * 1000;
                }
                // Always update notificationType and dueDate, never set sent=true
                await dynamoDB.update({
                    TableName: tableName,
                    Key: { id: notif.id },
                    UpdateExpression: 'set #notificationType = :nt, #dueDate = :dd',
                    ExpressionAttributeNames: { '#notificationType': 'notificationType', '#dueDate': 'dueDate' },
                    ExpressionAttributeValues: { ':nt': nextType, ':dd': nextDueDate }
                }).promise();
                notificationsSent++;
            } catch (err) {
                console.error('Error processing notification:', notif, err);
            }
        }
        return { statusCode: 200, body: JSON.stringify(`Notifications sent: ${notificationsSent}`) };
    } catch (err) {
        console.error('Lambda error:', err);
        return { statusCode: 500, body: JSON.stringify('Error sending notifications') };
    }
};
