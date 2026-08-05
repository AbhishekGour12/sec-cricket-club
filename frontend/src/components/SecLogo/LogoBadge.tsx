import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Circle } from 'react-native-svg';

interface LogoBadgeProps {
  size?: number;
}

const RING_STROKE = 4;
const RING_GAP = 7;

/**
 * SEC crest on a white disc, encircled by a blue-to-crimson ring with a
 * breathing gap between the two.
 */
export const LogoBadge: React.FC<LogoBadgeProps> = ({ size = 208 }) => {
  const center = size / 2;
  const ringRadius = center - RING_STROKE / 2;
  const discRadius = ringRadius - RING_STROKE / 2 - RING_GAP;
  const discSize = discRadius * 2;
  const logoSize = discSize * 0.8;

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id="secRing" x1="0.15" y1="0" x2="0.7" y2="1">
            <Stop offset="0" stopColor="#C7D6F2" />
            <Stop offset="0.3" stopColor="#8DA3D2" />
            <Stop offset="0.48" stopColor="#5A6E9E" />
            <Stop offset="0.6" stopColor="#A5182F" />
            <Stop offset="1" stopColor="#EA3350" />
          </LinearGradient>
          <LinearGradient id="secRingGlow" x1="0.15" y1="0" x2="0.7" y2="1">
            <Stop offset="0" stopColor="#C7D6F2" stopOpacity="0.35" />
            <Stop offset="0.5" stopColor="#5A6E9E" stopOpacity="0.18" />
            <Stop offset="1" stopColor="#EA3350" stopOpacity="0.35" />
          </LinearGradient>
        </Defs>

        <Circle
          cx={center}
          cy={center}
          r={ringRadius}
          stroke="url(#secRingGlow)"
          strokeWidth={RING_STROKE * 2.4}
          fill="none"
        />
        <Circle
          cx={center}
          cy={center}
          r={ringRadius}
          stroke="url(#secRing)"
          strokeWidth={RING_STROKE}
          fill="none"
        />
      </Svg>

      <View
        style={[
          styles.disc,
          { width: discSize, height: discSize, borderRadius: discRadius },
        ]}
      >
        <Image
          source={require('../../../assets/images/logo.png')}
          style={{ width: logoSize, height: logoSize }}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  disc: {
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
});

export default LogoBadge;
