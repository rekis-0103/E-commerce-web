import axios from 'axios';

// Menggunakan domain www.emsifa.com sebagai alternatif yang lebih stabil
const BASE_URL = 'https://www.emsifa.com/api-wilayah-indonesia/api';

export const regionService = {
  getProvinces: async () => {
    try {
      const res = await axios.get(`${BASE_URL}/provinces.json`);
      return res.data;
    } catch (err) {
      console.error("Error fetching provinces:", err);
      throw err;
    }
  },
  getRegencies: async (provinceId) => {
    if (!provinceId) return [];
    try {
      const res = await axios.get(`${BASE_URL}/regencies/${provinceId}.json`);
      return res.data;
    } catch (err) {
      console.error("Error fetching regencies:", err);
      return [];
    }
  },
  getDistricts: async (regencyId) => {
    if (!regencyId) return [];
    try {
      const res = await axios.get(`${BASE_URL}/districts/${regencyId}.json`);
      return res.data;
    } catch (err) {
      console.error("Error fetching districts:", err);
      return [];
    }
  },
  getVillages: async (districtId) => {
    if (!districtId) return [];
    try {
      const res = await axios.get(`${BASE_URL}/villages/${districtId}.json`);
      return res.data;
    } catch (err) {
      console.error("Error fetching villages:", err);
      return [];
    }
  }
};
