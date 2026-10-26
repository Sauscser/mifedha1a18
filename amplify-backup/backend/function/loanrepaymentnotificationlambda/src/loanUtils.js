const axios = require('axios');
// Helper: Fetch loan details from AppSync based on loanType
const queries = {
    GrpLn: `query GetCvrdGroupLoans($loanID: String!) {\n  getCvrdGroupLoans(loanID: $loanID) {\n    loanID\n    repaymentPeriod\n    crtnDate\n    amountExpectedBack\n    amountExpectedBackWthClrnc\n    amountRepaid\n    installmentAmount\n    loaneeName\n    lnType\n    status\n    LoanerName\n    paymentFrequency\n  }\n}`,
    SMLoan: `query GetSMLoansCovered($loanID: String!) {\n  getSMLoansCovered(loanID: $loanID) {\n    loanID\n    repaymentPeriod\n    crtnDate\n    amountExpectedBack\n    amountExpectedBackWthClrnc\n    amountRepaid\n    installmentAmount\n    loaneeName\n    lnType\n    status\n  }\n}`,
    Biz2Biz: `query GetCovCreditSeller($loanID: String!) {\n  getCovCreditSeller(loanID: $loanID) {\n    loanID\n    repaymentPeriod\n    crtnDate\n    amountExpectedBack\n    amountExpectedBackWthClrnc\n    amountRepaid\n    installmentAmount\n    loaneeName\n    lnType\n    status\n  }\n}`
};

async function fetchLoanDetails(loanID, loanType) {
    const endpoint = "https://w3grdoedrjbonhgvozu2xtbexa.appsync-api.us-east-1.amazonaws.com/graphql";
    const apiKey = "da2-igpwda2eqnb7zhzzna5wxcij4a";
    let query;
    if (loanType === 'GrpLn') query = queries.GrpLn;
    else if (loanType === 'SMLoan') query = queries.SMLoan;
    else if (loanType === 'Biz2Biz' || loanType === 'CredSlr') query = queries.Biz2Biz;
    else return null;
    const res = await axios.post(
        endpoint,
        {
            query,
            variables: { loanID }
        },
        { headers: { 'x-api-key': apiKey } }
    );
    const key =
        loanType === 'GrpLn' ? 'getCvrdGroupLoans' :
        loanType === 'SMLoan' ? 'getSMLoansCovered' :
        'getCovCreditSeller';
    return res.data.data[key];
}

module.exports = { fetchLoanDetails };