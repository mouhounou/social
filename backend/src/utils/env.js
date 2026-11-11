const isDev = () => ["development", "test"].includes(process.env.NODE_ENV);

module.exports = { isDev };
