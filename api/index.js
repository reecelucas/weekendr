const pick = require('lodash/pick');
const dateFormat = require('dateformat');
const { addMonths, getFormattedDateString } = require('../helpers/date');
const {
  API_ROOT,
  MAX_PRICE,
  OUTBOUND_MIN_TIME,
  OUTBOUND_MAX_TIME,
  INBOUND_MIN_TIME,
  INBOUND_MAX_TIME,
  OUTBOUND_DAY
} = require('../constants');

const getEndpoint = () => {
  const format = 'dd/mm/yyyy';
  const START_DATE = dateFormat(new Date(), format); // Today
  const END_DATE = dateFormat(addMonths(new Date(), 2), format); // 2 Months from today
  return `${API_ROOT}fly_from=LHR&date_from=${START_DATE}&date_to=${END_DATE}&dtime_from=${OUTBOUND_MIN_TIME}&dtime_to=${OUTBOUND_MAX_TIME}&ret_dtime_from=${INBOUND_MIN_TIME}&ret_dtime_to=${INBOUND_MAX_TIME}&fly_days=${OUTBOUND_DAY}&price_to=${MAX_PRICE}&max_stopovers=0&curr=GBP&nights_in_dst_from=2&nights_in_dst_to=2&adults=2&partner=picky`;
};

const normaliseRouteObject = routeObj => {
  const depart = getFormattedDateString(routeObj.dTime);
  const arrive = getFormattedDateString(routeObj.aTime);

  return {
    ...pick(routeObj, ['cityTo']),
    depart,
    arrive
  };
};

const normaliseTripDetails = trip => {
  const keyWhitelist = ['deep_link', 'route', 'price', 'dTime'];
  const { deep_link, route, price, dTime } = pick(trip, keyWhitelist);

  return {
    price,
    link: deep_link,
    departTimestamp: dTime, // UNIX timestamp
    outbound: normaliseRouteObject(route[0]),
    inbound: normaliseRouteObject(route[1])
  };
};

const removePriceVariants = trips =>
  trips.reduce((acc, trip) => {
    if (acc.find(({ outbound }) => outbound.cityTo === trip.outbound.cityTo)) {
      // We've already come across this trip before, so we're dealing with a
      // price variant. We only want to keep the first trip, since the API
      // returns trips in ascending order for price (so the first is the the cheapest).
      return acc;
    }

    return [...acc, trip];
  }, []);

const sortByEarliestDeparture = (a, b) => a.departTimestamp - b.departTimestamp;

const normaliseResponse = response => {
  const allTrips = response.data.map(normaliseTripDetails);
  return removePriceVariants(allTrips).sort(sortByEarliestDeparture);
};

module.exports = {
  normaliseResponse,
  getEndpoint
};
