import { Dimensions, Platform, StatusBar } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { moderateScale, scale, verticalScale } from 'react-native-size-matters';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Device size categories
export const isSmallDevice = SCREEN_WIDTH < 375;
export const isMediumDevice = SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 768;
export const isLargeDevice = SCREEN_WIDTH >= 768;
export const isTablet = SCREEN_WIDTH >= 768;

// Responsive width - percentage based
export const responsiveWidth = (percentage) => wp(percentage);

// Responsive height - percentage based
export const responsiveHeight = (percentage) => hp(percentage);

// Responsive font size - scales based on screen width
export const responsiveFontSize = (size) => moderateScale(size, 0.3);

// Responsive spacing - scales based on screen dimensions
export const responsiveSpacing = (size) => moderateScale(size, 0.2);

// Responsive size for icons, images, etc.
export const responsiveSize = (size) => scale(size);

// Responsive vertical spacing
export const responsiveVerticalSpacing = (size) => verticalScale(size);

// Get responsive padding/margin
export const getResponsivePadding = (basePadding) => {
  if (isSmallDevice) return basePadding * 0.8;
  if (isLargeDevice) return basePadding * 1.3;
  return basePadding;
};

// Get responsive border radius
export const getResponsiveBorderRadius = (baseRadius) => {
  if (isSmallDevice) return baseRadius * 0.9;
  if (isLargeDevice) return baseRadius * 1.2;
  return baseRadius;
};

// Safe area helpers
export const getStatusBarHeight = () => {
  return Platform.OS === 'android' ? StatusBar.currentHeight || 0 : 44;
};

// Get responsive button height
export const getResponsiveButtonHeight = () => {
  if (isSmallDevice) return 50;
  if (isLargeDevice) return 70;
  return 60;
};

// Get responsive input height
export const getResponsiveInputHeight = () => {
  if (isSmallDevice) return 50;
  if (isLargeDevice) return 65;
  return 60;
};

// Card shadow styles - responsive
export const getResponsiveShadow = (elevation = 8) => {
  const shadowIntensity = isLargeDevice ? 1.2 : 1;
  return {
    shadowColor: "#000",
    shadowOffset: { 
      width: 0, 
      height: moderateScale(elevation * 0.5 * shadowIntensity) 
    },
    shadowOpacity: 0.1 * shadowIntensity,
    shadowRadius: moderateScale(elevation * shadowIntensity),
    elevation: elevation,
  };
};

// Responsive grid columns
export const getGridColumns = () => {
  if (isSmallDevice) return 1;
  if (isTablet) return 3;
  return 2;
};

// Export screen dimensions
export { SCREEN_WIDTH, SCREEN_HEIGHT };

// Export all scale functions
export { wp, hp, moderateScale, scale, verticalScale };

export default {
  width: responsiveWidth,
  height: responsiveHeight,
  fontSize: responsiveFontSize,
  spacing: responsiveSpacing,
  size: responsiveSize,
  verticalSpacing: responsiveVerticalSpacing,
  padding: getResponsivePadding,
  borderRadius: getResponsiveBorderRadius,
  shadow: getResponsiveShadow,
  buttonHeight: getResponsiveButtonHeight,
  inputHeight: getResponsiveInputHeight,
  gridColumns: getGridColumns,
  isSmall: isSmallDevice,
  isMedium: isMediumDevice,
  isLarge: isLargeDevice,
  isTablet: isTablet,
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
};
