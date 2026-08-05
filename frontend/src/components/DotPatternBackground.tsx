import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Defs, Pattern, Circle, Rect } from 'react-native-svg';

interface DotPatternBackgroundProps {
  color?: string;
}

const { width, height } = Dimensions.get('window');

export const DotPatternBackground: React.FC<DotPatternBackgroundProps> = ({
  color = 'rgba(255,255,255,0.04)',
}) => (
  <View style={StyleSheet.absoluteFill} pointerEvents="none">
    <Svg width={width} height={height}>
      <Defs>
        <Pattern id="dotGrid" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <Circle cx="1" cy="1" r="0.8" fill={color} />
        </Pattern>
      </Defs>
      <Rect x="0" y="0" width={width} height={height} fill="url(#dotGrid)" />
    </Svg>
  </View>
);

export default DotPatternBackground;
