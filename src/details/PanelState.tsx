import type { UseQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import type { SatelliteDetails } from '../../shared/api-types.ts';

interface Props {
  query: UseQueryResult<SatelliteDetails>;
  className?: string;
  children: (data: SatelliteDetails) => ReactNode;
}

/** Einheitliche Lade- und Fehlerzustände für alle Detail-Panels */
export function PanelState({ query, className = '', children }: Props) {
  if (query.isPending) return <div className={`panel-card ${className}`}>Lädt …</div>;
  if (query.isError) return <div className={`panel-card error ${className}`}>Fehler: {query.error.message}</div>;
  return <div className={`panel-card ${className}`}>{children(query.data)}</div>;
}
