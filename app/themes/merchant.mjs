import {defineTheme} from '@astryxdesign/core/theme';
import {neutralTheme} from '@astryxdesign/theme-neutral';

// Rebuild the static SSR theme with: corepack pnpm exec astryx theme build app/themes/merchant.mjs
const palette={
  canvas:'#fdf7f7',surface:'#fffcfc',quiet:'#f4e9ec',
  ink:'#372d32',muted:'#78636b',line:'#e4d4da',outline:'#a28791',
  selection:'#fedcdb',selectionHover:'#f6c8ce',
  action:'#93465e',actionHover:'#7e3c51',
  success:'#356b59',pending:'#7a5b2e',error:'#a03646',
};

export const merchantTheme=defineTheme({
  name:'hotlah-merchant',
  extends:neutralTheme,
  tokens:{
    '--color-accent':palette.action,
    '--color-accent-muted':palette.selection,
    '--color-on-accent':palette.surface,
    '--color-text-accent':palette.action,
    '--color-icon-accent':palette.action,
    '--color-background-body':palette.canvas,
    '--color-background-surface':palette.surface,
    '--color-background-card':palette.surface,
    '--color-background-popover':palette.surface,
    '--color-background-muted':palette.quiet,
    '--color-background-inverted':palette.ink,
    '--color-text-primary':palette.ink,
    '--color-text-secondary':palette.muted,
    '--color-icon-primary':palette.ink,
    '--color-icon-secondary':palette.muted,
    '--color-border':palette.line,
    '--color-border-emphasized':palette.outline,
    '--color-skeleton':palette.line,
    '--color-track':palette.line,
    '--color-success':palette.success,
    '--color-error':palette.error,
    '--focus-outline-color':palette.action,
  },
  // Bridge established Hotlah controls to the same theme, including portaled dialogs.
  localTokens:{
    '--paper':palette.canvas,
    '--paper-raised':palette.surface,
    '--paper-quiet':palette.quiet,
    '--ink':palette.ink,
    '--muted':palette.muted,
    '--line':palette.line,
    '--line-strong':palette.outline,
    '--yellow':palette.selection,
    '--yellow-hover':palette.selectionHover,
    '--green':palette.success,
    '--merchant-action':palette.action,
    '--merchant-action-hover':palette.actionHover,
    '--merchant-on-action':palette.surface,
    '--merchant-pending':palette.pending,
    '--merchant-error':palette.error,
  },
});
