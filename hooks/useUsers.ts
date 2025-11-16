import { useSelector } from "react-redux";

export function useUser(userId?: string | null) {
  const user = useSelector((state: any) => (userId ? state.usersLive?.byId?.[userId] ?? null : null));
  return user;
}