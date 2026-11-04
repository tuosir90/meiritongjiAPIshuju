/**
 * Optional APIMart DNS override for networks that return a poisoned address.
 */

const { isIP } = require('node:net');

function buildChromiumLaunchOptions(env = process.env) {
  const resolverIp = String(env.APIMART_HOST_RESOLVER_IP || '').trim();
  if (!resolverIp) return {};
  if (isIP(resolverIp) !== 4) {
    throw new Error('APIMART_HOST_RESOLVER_IP must be a valid IPv4 address');
  }

  return {
    args: [`--host-resolver-rules=MAP apimart.ai ${resolverIp},EXCLUDE localhost`],
  };
}

module.exports = {
  buildChromiumLaunchOptions,
};
