const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

export async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...options.headers
  };

  const config = {
    ...options,
    headers
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      throw { status: res.status, message: data.message || 'Terjadi kesalahan pada server' };
    }
    return data;
  } catch (err) {
    if (err.status) throw err;
    throw { status: 500, message: 'Tidak dapat terhubung ke server backend' };
  }
}
