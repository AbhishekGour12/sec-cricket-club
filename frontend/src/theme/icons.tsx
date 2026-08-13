import React from 'react';
import { ColorValue } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Colors } from './colors';

// Define standardized icon mappings to ensure consistent Material Round style
export const IconMap = {
  home: 'home',
  event: 'event',
  directory: 'people',
  announcement: 'campaign',
  profile: 'person',
  settings: 'settings',
  search: 'search',
  phone: 'phone',
  lock: 'lock-outline',
  chevronRight: 'chevron-right',
  chevronLeft: 'chevron-left',
  close: 'close',
  error: 'error-outline',
  info: 'info-outline',
  check: 'check-circle',
  calendar: 'today',
  logout: 'logout',
  notification: 'notifications',
  menu: 'menu',
  star: 'star',
  trophy: 'emoji-events',
  sports: 'sports-cricket',
  share: 'share',
  arrowBack: 'arrow-back',
  bookmark: 'bookmark',
  bookmarkBorder: 'bookmark-border',
  add: 'add',
  edit: 'edit',
  delete: 'delete-outline',
  visible: 'visibility',
  hidden: 'visibility-off',
  email: 'email',
  link: 'link',
  business: 'business',
  work: 'work',
  camera: 'photo-camera',
  save: 'save',
  image: 'image',
  gallery: 'photo-library',
} as const;

export type IconName = keyof typeof IconMap;

interface IconProps {
  name: IconName;
  size?: number;
  color?: ColorValue;
  style?: any;
}

export const ThemeIcon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = Colors.primary,
  style,
}) => {
  const glyphName = IconMap[name] || 'help-outline';
  return (
    <MaterialIcons
      name={glyphName as any}
      size={size}
      color={color}
      style={style}
    />
  );
};

export default ThemeIcon;
