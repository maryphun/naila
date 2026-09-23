import type { STYLES } from './types';

// Inspiration only, not photos of a merchant's work. Related techniques can overlap.
export const STYLE_EXAMPLES: Record<typeof STYLES[number], { image: string; en: string; zh: string }> = {
  French: { image: '/images/styles/picker-french.webp', en: 'Glittering French tips with tiny gems', zh: '闪亮法式甲尖与细小水钻' },
  'Cat eye': { image: '/images/styles/picker-cat-eye.webp', en: 'Deep red cat-eye shimmer', zh: '深红色猫眼光泽' },
  Glazed: { image: '/images/styles/picker-glazed.webp', en: 'Soft, pearly sheen', zh: '柔和细腻的珍珠光泽' },
  Minimal: { image: '/images/styles/picker-minimal.webp', en: 'Minimal black and white tips', zh: '简约黑白甲尖' },
  'Hand-painted': { image: '/images/styles/picker-hand-painted.webp', en: 'Colourful hand-painted details', zh: '缤纷手绘细节' },
  Chrome: { image: '/images/styles/picker-chrome.webp', en: 'Black nails with metallic details', zh: '黑色美甲与金属装饰' },
  '3D art': { image: '/images/styles/picker-3d-art.webp', en: 'Raised strawberries and flowers', zh: '立体草莓与花朵装饰' },
  Korean: { image: '/images/styles/picker-korean.webp', en: 'Pink jelly nails with tiny charms', zh: '粉色果冻美甲与精致饰物' },
  Chinese: { image: '/images/styles/picker-chinese.webp', en: 'Red and gold ornamental details', zh: '红金配色与精致纹样' },
  Mirror: { image: '/images/styles/picker-mirror.webp', en: 'A reflective, mirror-like shine', zh: '如镜面般明亮的反光' },
  Magnet: { image: '/images/styles/picker-magnet.webp', en: 'Pink magnetic shimmer', zh: '粉色磁吸光泽' },
};
