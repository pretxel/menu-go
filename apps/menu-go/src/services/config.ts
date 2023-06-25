export const getConfig = async () => {
  const configResponse = await fetch('/api/config');
  const config = await configResponse.json();
  return config;
};
