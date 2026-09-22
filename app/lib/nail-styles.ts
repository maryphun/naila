import type { STYLES } from './types';

// Inspiration only, not photos of a merchant's work. Related techniques can overlap.
export const STYLE_EXAMPLES: Record<typeof STYLES[number], { image: string; en: string; zh: string }> = {
  French: { image: '/images/french.webp', en: 'Clean tips, timeless finish', zh: '干净甲尖，经典耐看' },
  'Cat eye': { image: '/images/cat-eye.webp', en: 'A focused band of light', zh: '聚光猫眼，灵动光带' },
  Glazed: { image: '/images/glazed.webp', en: 'Soft, pearly sheen', zh: '柔和细腻的珍珠光泽' },
  Minimal: { image: '/images/styles/minimal.webp', en: 'Simple lines, subtle details', zh: '简洁线条，细致点缀' },
  'Hand-painted': { image: '/images/cherry.webp', en: 'Little details, painted by hand', zh: '一笔一画，手绘细节' },
  Chrome: { image: '/images/styles/chrome.webp', en: 'A polished metallic finish', zh: '亮丽的金属质感' },
  '3D art': { image: '/images/styles/3d-art.webp', en: 'Sculpted flowers and raised details', zh: '立体花朵与浮雕装饰' },
  Korean: { image: '/images/styles/korean.webp', en: 'Jelly tones and soft blush', zh: '通透果冻色与柔和腮红' },
  Chinese: { image: '/images/styles/chinese.webp', en: 'Rich colour and ornate details', zh: '浓郁色彩与精致纹样' },
  Mirror: { image: '/images/styles/chrome.webp', en: 'A reflective, mirror-like shine', zh: '如镜面般明亮的反光' },
  Magnet: { image: '/images/cat-eye.webp', en: 'Magnetic shimmer and light effects', zh: '磁吸闪烁与光影变化' },
};
