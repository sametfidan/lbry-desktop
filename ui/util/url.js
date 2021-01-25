// Can't use aliases here because we're doing exports/require
const PAGES = require('../constants/pages');
const { parseURI, buildURI } = require('lbry-redux');

function encodeWithApostropheEncode(string) {
  // encodeURIComponent doesn't encode `'`
  // in most cases this is fine, but wordpress doesn't like it
  return encodeURIComponent(string).replace(/'/g, '%27');
}

export const formatLbryUrlForWeb = uri => {
  let newUrl = uri.replace('lbry://', '/').replace(/#/g, ':');
  if (newUrl.startsWith('/?')) {
    // This is a lbry link to an internal page ex: lbry://?rewards
    newUrl = newUrl.replace('/?', '/$/');
  }

  return newUrl;
};

export const formatFileSystemPath = path => {
  if (!path) {
    return;
  }

  let webUrl = path.replace(/\\/g, '/');

  if (webUrl[0] !== '/') {
    webUrl = `/${webUrl}`;
  }

  return encodeURI(`file://${webUrl}`).replace(/[?#]/g, encodeURIComponent);
};

/*
  Function that handles page redirects
  ex: lbry://?rewards
  ex: open.lbry.com/?rewards
*/
export const formatInAppUrl = path => {
  // Determine if we need to add a leading "/$/" for app pages
  const APP_PAGE_REGEX = /(\?)([a-z]*)(.*)/;
  const appPageMatches = APP_PAGE_REGEX.exec(path);

  if (appPageMatches && appPageMatches.length) {
    // Definitely an app page (or it's formatted like one)
    const [, , page, queryString] = appPageMatches;

    if (Object.values(PAGES).includes(page)) {
      let actualUrl = '/$/' + page;

      if (queryString) {
        actualUrl += `?${queryString.slice(1)}`;
      }

      return actualUrl;
    }
  }

  // Regular claim url
  return path;
};

export const formatWebUrlIntoLbryUrl = (pathname, search) => {
  // If there is no uri, the user is on an internal page
  // pathname will either be "/" or "/$/{page}"
  const path = pathname.startsWith('/$/') ? pathname.slice(3) : pathname.slice(1);
  let appLink = `lbry://?${path || PAGES.DISCOVER}`;

  if (search) {
    // We already have a leading "?" for the query param on internal pages
    appLink += search.replace('?', '&');
  }

  return appLink;
};

export const generateInitialUrl = hash => {
  let url = '/';
  if (hash) {
    hash = hash.replace('#', '');
    url = hash.startsWith('/') ? hash : '/' + hash;
  }
  return url;
};

export const generateLbryContentUrl = (canonicalUrl, permanentUrl) => {
  return canonicalUrl ? canonicalUrl.split('lbry://')[1] : permanentUrl.split('lbry://')[1];
};

export const generateLbryWebUrl = lbryUrl => {
  return lbryUrl.replace(/#/g, ':');
};

export const generateEncodedLbryURL = (domain, lbryWebUrl, includeStartTime, startTime) => {
  const queryParam = includeStartTime ? `?t=${startTime}` : '';
  const encodedPart = encodeWithApostropheEncode(`${lbryWebUrl}${queryParam}`);
  return `${domain}/${encodedPart}`;
};

export const generateShareUrl = (domain, lbryUrl, referralCode, rewardsApproved, includeStartTime, startTime) => {
  let urlParams = new URLSearchParams();
  if (referralCode && rewardsApproved) {
    urlParams.append('r', referralCode);
  }

  if (includeStartTime) {
    urlParams.append('t', startTime.toString());
  }

  const urlParamsString = urlParams.toString();

  const { streamName, streamClaimId, channelName, channelClaimId } = parseURI(lbryUrl);

  let uriParts = {
    ...(streamName ? { streamName: encodeWithApostropheEncode(streamName) } : {}),
    ...(streamClaimId ? { streamClaimId } : {}),
    ...(channelName ? { channelName: encodeWithApostropheEncode(channelName) } : {}),
    ...(channelClaimId ? { channelClaimId } : {}),
  };

  const encodedUrl = buildURI(uriParts, false);
  const lbryWebUrl = encodedUrl.replace(/#/g, ':');

  const url = `${domain}/${lbryWebUrl}` + (urlParamsString === '' ? '' : `?${urlParamsString}`);
  return url;
};
