const localConfig = {
  ...process.env,
};

const backendUrl = process.env.REACT_APP_BACKEND_URL || '';

export async function loadRemoteConfig(route) {
  let plan = route && route !== '/' ? route.split('/')[1].toLowerCase() : 'yearly';
  if (!['monthly', 'yearly', 'yearly-$147', 'yearly-147', 'annual', 'annual-$147', 'annual-147'].includes(plan)) {
    plan = '';
  }
  const response = await fetch(`${backendUrl}/config/${plan}`, {
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
