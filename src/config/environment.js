const localConfig = {
  ...process.env,
};

export async function loadRemoteConfig() {
  const response = await fetch(`${process.env.REACT_APP_BACKEND_URL || ''}/config`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });
  if (response.ok) {
    const remoteConfig = await response.json();
    Object.assign(localConfig, remoteConfig);
  }
  if (localConfig.DEBUG) {
    console.log('Environment:', localConfig);
  }
  return localConfig;
}

export default localConfig;
