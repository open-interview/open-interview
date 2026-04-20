import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function StatsRedirect() {
  const [, nav] = useLocation();
  useEffect(() => { nav('/profile'); }, [nav]);
  return null;
}
