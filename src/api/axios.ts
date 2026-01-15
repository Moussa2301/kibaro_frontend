//import axios from "axios";

//const api = axios.create({
  //baseURL: "http://localhost:4000/api",
  //baseURL: `${import.meta.env.VITE_API_URL}/api`,
//const API_URL = import.meta.env.VITE_API_URL || "/api";
//const api = axios.create({
  //baseURL: "/api", // grâce au proxy Vite
  //withCredentials: false, // mets true seulement si cookies/sessions

  //baseURL: import.meta.env.VITE_API_URL || "http://192.168.56.1:4001/api",
//});
//export default api;

/*api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
// export default api;*/
// src/api/axios.ts
// src/api/axios.ts
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:4001/api",
});

// inject token automatiquement si présent
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

