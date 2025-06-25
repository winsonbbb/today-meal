import axios from "axios";

const API_URL = "http://localhost:4000/api/restaurants";

export const getRestaurants = async () => {
  const res = await axios.get(API_URL);
  return res.data;
};

export const addRestaurant = async (restaurant: any) => {
  const res = await axios.post(API_URL, restaurant);
  return res.data;
};

export const updateRestaurant = async (name: string, update: any) => {
  const res = await axios.put(`${API_URL}/${encodeURIComponent(name)}`, update);
  return res.data;
};

export const deleteRestaurant = async (name: string) => {
  const res = await axios.delete(`${API_URL}/${encodeURIComponent(name)}`);
  return res.data;
};
