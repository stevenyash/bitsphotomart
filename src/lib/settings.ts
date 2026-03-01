import { prisma } from '@/lib/prisma';

/**
 * Platform Settings Keys
 * 
 * Fee Types:
 * - PHOTO_FEE: Platform fee for stock photo sales
 * - VIDEO_FEE: Platform fee for stock video sales
 * - SERVICE_FEE: Platform fee for service bookings (photography, videography, etc.)
 */
export const SETTINGS_KEYS = {
  // Stock media fees
  PHOTO_FEE_PERCENT: 'photo_fee_percent',
  VIDEO_FEE_PERCENT: 'video_fee_percent',
  
  // Service booking fees
  SERVICE_FEE_PERCENT: 'service_fee_percent',
  
  // Defaults
  DEFAULT_PHOTO_FEE: '10',   // 10% for photos
  DEFAULT_VIDEO_FEE: '10',   // 10% for videos
  DEFAULT_SERVICE_FEE: '10', // 10% for services
} as const;

// Fee type enum
export type FeeType = 'PHOTO' | 'VIDEO' | 'SERVICE';

/**
 * Get platform fee percentage by type from settings
 * @param type - The type of fee (PHOTO, VIDEO, SERVICE)
 * @returns Platform fee as a decimal (e.g., 0.1 for 10%)
 */
export async function getFeePercentByType(type: FeeType): Promise<number> {
  let key: string;
  let defaultValue: string;
  
  switch (type) {
    case 'PHOTO':
      key = SETTINGS_KEYS.PHOTO_FEE_PERCENT;
      defaultValue = SETTINGS_KEYS.DEFAULT_PHOTO_FEE;
      break;
    case 'VIDEO':
      key = SETTINGS_KEYS.VIDEO_FEE_PERCENT;
      defaultValue = SETTINGS_KEYS.DEFAULT_VIDEO_FEE;
      break;
    case 'SERVICE':
      key = SETTINGS_KEYS.SERVICE_FEE_PERCENT;
      defaultValue = SETTINGS_KEYS.DEFAULT_SERVICE_FEE;
      break;
  }
  
  try {
    const setting = await prisma.setting.findUnique({
      where: { key },
    });
    
    if (setting) {
      const fee = parseFloat(setting.value);
      if (!isNaN(fee) && fee >= 0 && fee <= 100) {
        return fee / 100;
      }
    }
  } catch (error) {
    console.error(`Error fetching ${type} fee from settings:`, error);
  }
  
  return parseFloat(defaultValue) / 100;
}

/**
 * Calculate fee split for any amount and fee type
 */
export async function calculateFeeSplitByType(
  amount: number, 
  type: FeeType
): Promise<{
  platformFee: number;
  netEarnings: number;
  feePercent: number;
}> {
  const feePercent = await getFeePercentByType(type);
  const platformFee = Math.round(amount * feePercent);
  const netEarnings = amount - platformFee;
  
  return {
    platformFee,
    netEarnings,
    feePercent: feePercent * 100,
  };
}

/**
 * Backwards compatible - Get platform fee for photos (default)
 * @returns Platform fee as a decimal (e.g., 0.1 for 10%)
 */
export async function getPlatformFeePercent(): Promise<number> {
  return getFeePercentByType('PHOTO');
}

/**
 * Backwards compatible - Calculate platform fee and photographer earnings
 */
export async function calculateFeeSplit(amount: number): Promise<{
  platformFee: number;
  photographerEarnings: number;
  platformFeePercent: number;
}> {
  const result = await calculateFeeSplitByType(amount, 'PHOTO');
  return {
    platformFee: result.platformFee,
    photographerEarnings: result.netEarnings,
    platformFeePercent: result.feePercent,
  };
}

/**
 * Update platform fee for a specific type
 * @param type - Fee type (PHOTO, VIDEO, SERVICE)
 * @param feePercent - New fee percentage (0-100)
 */
export async function updateFeeByType(type: FeeType, feePercent: number): Promise<void> {
  if (feePercent < 0 || feePercent > 100) {
    throw new Error('Platform fee must be between 0 and 100');
  }
  
  let key: string;
  switch (type) {
    case 'PHOTO':
      key = SETTINGS_KEYS.PHOTO_FEE_PERCENT;
      break;
    case 'VIDEO':
      key = SETTINGS_KEYS.VIDEO_FEE_PERCENT;
      break;
    case 'SERVICE':
      key = SETTINGS_KEYS.SERVICE_FEE_PERCENT;
      break;
  }
  
  await prisma.setting.upsert({
    where: { key },
    update: { 
      value: feePercent.toString(),
      description: `Platform ${type.toLowerCase()} fee percentage (e.g., 10 = 10%)`,
    },
    create: {
      key,
      value: feePercent.toString(),
      description: `Platform ${type.toLowerCase()} fee percentage (e.g., 10 = 10%)`,
    },
  });
}

/**
 * Get all platform fee settings
 */
export async function getAllFeeSettings(): Promise<{
  photoFeePercent: number;
  videoFeePercent: number;
  serviceFeePercent: number;
}> {
  const [photoFee, videoFee, serviceFee] = await Promise.all([
    getFeePercentByType('PHOTO'),
    getFeePercentByType('VIDEO'),
    getFeePercentByType('SERVICE'),
  ]);
  
  return {
    photoFeePercent: photoFee * 100,
    videoFeePercent: videoFee * 100,
    serviceFeePercent: serviceFee * 100,
  };
}
