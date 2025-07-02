// src/components/RestaurantList.tsx
import React from "react";
import { Restaurant } from "../types";
import RestaurantListItem from "./RestaurantListItem";

interface RestaurantListProps {
  restaurants: Restaurant[];
  isChosenToday: (r: Restaurant) => boolean;
  getRecencyColor: (dateStr: string | null) => string;
  getRelativeTime: (dateStr: string) => string;
  onEditRestaurant: (restaurant: Restaurant) => void;
  onToggleRestaurantDisable: (id: string, disabled: boolean) => void;
  onDeleteRestaurant: (id: string) => void;
  onReactivateRestaurant: (id: string) => void;
}

const RestaurantList: React.FC<RestaurantListProps> = ({
  restaurants,
  isChosenToday,
  getRecencyColor,
  getRelativeTime,
  onEditRestaurant,
  onToggleRestaurantDisable,
  onDeleteRestaurant,
  onReactivateRestaurant,
}) => {
  if (restaurants.length === 0) {
    return (
      <p className="text-center text-gray-500">
        No restaurants found. Try adding some!
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {restaurants.map((r) => (
        <RestaurantListItem
          key={r.id}
          restaurant={r}
          isChosenToday={isChosenToday}
          getRecencyColor={getRecencyColor}
          getRelativeTime={getRelativeTime}
          onEdit={onEditRestaurant}
          onToggleDisable={onToggleRestaurantDisable}
          onDelete={onDeleteRestaurant}
          onReactivate={onReactivateRestaurant}
        />
      ))}
    </ul>
  );
};

export default RestaurantList;
