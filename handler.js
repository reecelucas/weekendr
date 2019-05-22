const AWS = require('aws-sdk');
const fetch = require('./node_modules/node-fetch');
const style = require('./helpers/style');
const { normaliseResponse, getEndpoint } = require('./api');

const ses = new AWS.SES();

const headingStyles = style`
  color: #444;
  font-size: 20px;
  font-weight: 400;
  line-height: 26px;
  margin-bottom: 12px;
`;

const subheadingStyles = style`
  color: #486d87;
  font-size: 16px;
  line-height: 20px;
  margin-bottom: 6px;
`;

const anchorStyles = style`
  color: inherit;
  display: inline-block;
  font-size: inherit;
`;

const listStyles = style`
  list-style: none;
  margin: 0px;
  padding: 0px;
`;

const listItemStyles = style`
  display: block;
  margin-bottom: 24px;
`;

const priceStyles = style`
  background-color: #f2f2f2;
  border-radius: 4px;
  display: inline-block;
  font-size: 14px;
  line-height: 14px;
  margin-left: 6px;
  padding: 4px;
`;

const spanStyles = style`
  display: block;
  font-size: 14px;
  line-height: 22px;
`;

const getTrips = async () => {
  try {
    const responseJSON = await fetch(getEndpoint());
    const response = await responseJSON.json();
    return normaliseResponse(response);
  } catch (error) {
    console.error(error);
  }
};

const generateTripListMarkup = trips =>
  trips.reduce(
    (str, trip) =>
      (str += `
      <li style="${listItemStyles}">
        <h2 style="${subheadingStyles}">
          <a
            style="${anchorStyles}"
            href="${trip.link}"
            rel="noopener noreferrer"
          >
            ${trip.outbound.cityTo}
          </a>
          <span style="${priceStyles}">&#163;${trip.price}</span>
        </h2>
        <span style="${spanStyles}">Leaving: ${trip.outbound.depart}</span>
        <span style="${spanStyles}">Returning: ${trip.inbound.depart}</span>
      </li>
    `),
    ''
  );

const generateEmailParams = trips => {
  return {
    Source: process.env.EMAIL,
    Destination: {
      ToAddresses: [process.env.EMAIL]
    },
    Message: {
      Body: {
        Html: {
          Data: `
            <html lang="en-GB">
              <head>
                <title>Weekendr — Upcoming Trips!</title>
              </head>
              <body>
                <h1 style="${headingStyles}">
                  ✈ Flying out of Heathrow (LHR) soon
                </h1>
                <ul style="${listStyles}">
                  ${generateTripListMarkup(trips)}
                </ul>
              </body>
            </html>
          `
        }
      },
      Subject: {
        Charset: 'UTF-8',
        Data: 'Weekendr — Upcoming Trips!'
      }
    }
  };
};

module.exports.send = async () => {
  try {
    const trips = await getTrips();

    if (trips.length > 0) {
      const emailParams = generateEmailParams(trips);
      await ses.sendEmail(emailParams).promise();
    }
  } catch (error) {
    return error;
  }
};
