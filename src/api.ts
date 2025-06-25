import axios from "axios";

const API_URL = "http://localhost:4000/api/restaurants";
const getToken = () => localStorage.getItem("mealdraw_token");

const authHeader = () => ({
  headers: { "X-Auth-Token": getToken() },
});

export const getRestaurants = async () => {
  const res = await axios.get(API_URL, authHeader());
  return res.data;
};

export const addRestaurant = async (restaurant: any) => {
  const res = await axios.post(API_URL, restaurant, authHeader());
  return res.data;
};

export const updateRestaurant = async (id: number, update: any) => {
  const res = await axios.put(`${API_URL}/${encodeURIComponent(id)}`, update, authHeader());
  return res.data;
};

export const deleteRestaurant = async (id: number) => {
  const res = await axios.delete(`${API_URL}/${encodeURIComponent(id)}`, authHeader());
  return res.data;
};
