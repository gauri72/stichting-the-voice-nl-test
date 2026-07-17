/**
 * @typedef {Object} Business
 * @property {string} id
 * @property {string} name
 * @property {string} slug
 * @property {string} category
 * @property {string} categoryLabel
 * @property {string} description
 * @property {string} location
 * @property {number} rating
 * @property {number} reviewCount
 * @property {string} imageUrl
 * @property {string} [logoUrl]
 * @property {string[]} tags
 * @property {boolean} featured
 * @property {boolean} verified
 * @property {string} shopUrl
 * @property {number} cashbackPercent
 */

/**
 * @typedef {Object} Product
 * @property {string} id
 * @property {string} businessId
 * @property {string} businessName
 * @property {string} businessSlug
 * @property {string} name
 * @property {string} slug
 * @property {string} category
 * @property {string} imageUrl
 * @property {number} price
 * @property {'EUR'} currency
 * @property {number} cashbackPercent
 * @property {boolean} favourite
 */

/**
 * @typedef {Object} MarketplaceStats
 * @property {number} [activeShops]
 * @property {number} [verifiedBusinesses]
 * @property {number} [customers]
 * @property {number} [countries]
 * @property {number} [categories]
 */
