import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";

export function useFocusSkeleton(duration = 420) {
  const [active, setActive] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setActive(true);
      const timer = setTimeout(() => setActive(false), duration);
      return () => clearTimeout(timer);
    }, [duration]),
  );

  return active;
}
