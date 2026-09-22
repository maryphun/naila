import { Check } from 'lucide-react';
import { useApp } from '../lib/context';
import { STYLES, STYLE_ZH } from '../lib/types';
import { STYLE_EXAMPLES } from '../lib/nail-styles';
import { Modal } from './ui';

export function NailStylePicker({ open, value, onChoose, onOpenChange }: {
  open: boolean;
  value: string;
  onChoose: (style: string) => void;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, lang } = useApp();
  return <Modal open={open} onOpenChange={onOpenChange} className="nail-style-dialog"
    title={t('What’s your nail mood?', '您喜欢什么美甲风格？')}
    description={t('Tap a photo to explore a style. AI-generated examples are inspiration, not merchant work.', '点击图片选择款式。AI 生成示例仅供灵感参考，并非商家作品。')}>
    {open && <ul className="nail-style-options" aria-label={t('Nail style examples', '美甲款式示例')}>
      {STYLES.map(style => {
        const example = STYLE_EXAMPLES[style];
        const label = lang === 'zh' ? STYLE_ZH[style] : style;
        return <li key={style}>
          <button type="button" className="nail-style-option" aria-label={label} aria-pressed={value === style} onClick={() => onChoose(style)}>
            <img src={example.image} width={96} height={96} alt={t(example.en, example.zh)} decoding="async"/>
            <strong>{label}</strong>
            {value === style && <Check size={16} aria-hidden="true"/>}
          </button>
        </li>;
      })}
    </ul>}
    <button type="button" className="button secondary full" aria-pressed={value === 'All'} onClick={() => onChoose('All')}>
      {t('Show me everything', '浏览所有款式')}
    </button>
  </Modal>;
}
