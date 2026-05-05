import { useMemo } from 'react';
import { useMaapContext } from '../MaapContext';
import { createMaapApi } from '../utils/api';

export function useMaapApi() {
  const { getLatestSettings } = useMaapContext();
  return useMemo(() => createMaapApi(getLatestSettings), [getLatestSettings]);
}
