/**
 * ToggleControl - SmartAgriculture X Equipment Power ON/OFF Component
 * Re-exports the unified PowerControlCard for seamless backward-compatibility.
 */
import React from 'react';
import { PowerControlCard, PowerControlCardProps } from './PowerControlCard';

export interface ToggleControlProps extends PowerControlCardProps {}

export const ToggleControl: React.FC<ToggleControlProps> = (props) => {
  return <PowerControlCard {...props} />;
};

export default ToggleControl;
