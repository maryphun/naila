import { Links,Meta,Outlet,Scripts,ScrollRestoration,useLoaderData,isRouteErrorResponse,useRouteError,useLocation,Link } from 'react-router';
import type { LoaderFunctionArgs,LinksFunction } from 'react-router';
import { AppProvider } from './lib/context';
import { Shell } from './components/shell';
import { BrandWordmark } from './components/brand-wordmark';
import { serverApi } from './lib/server.server';
import type { SessionInfo,Language } from './lib/types';
import { Theme } from '@astryxdesign/core/theme';
import { neutralTheme } from '@astryxdesign/theme-neutral/built';
import { hotlahMerchantTheme as merchantTheme } from './themes/hotlah-merchant.js';
import '@fontsource-variable/manrope';
import './styles.css';
export const links:LinksFunction=()=>[{rel:'icon',href:'/favicon-32.png',type:'image/png',sizes:'32x32'},{rel:'apple-touch-icon',href:'/apple-touch-icon.png',sizes:'180x180'},{rel:'manifest',href:'/manifest.webmanifest'}];
export async function loader({request,context}:LoaderFunctionArgs){return {session:await serverApi<SessionInfo>(request,context,'/api/session'),lang:request.headers.get('cookie')?.includes('hotlah_lang=zh')?'zh' as const:'en' as const};}
function useWorkspaceTheme(){const location=useLocation();return location.pathname.startsWith('/merchant')||new URLSearchParams(location.search).get('view')==='merchant'?merchantTheme:neutralTheme;}
export function Layout({children}:{children:React.ReactNode}){const theme=useWorkspaceTheme();return <html lang="en" data-theme="light" data-astryx-theme={theme.name}><head><meta charSet="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover"/><meta name="theme-color" content={theme===merchantTheme?merchantTheme.localTokens?.['--paper']:'#faf9ef'}/><Meta/><Links/></head><body>{children}<ScrollRestoration/><Scripts/></body></html>;}
export default function App(){const {session,lang}=useLoaderData<typeof loader>();const theme=useWorkspaceTheme();return <Theme theme={theme} mode="light"><AppProvider initial={session} language={lang}><Shell><Outlet/></Shell></AppProvider></Theme>;}
export function ErrorBoundary(){const error=useRouteError();const missing=isRouteErrorResponse(error)&&error.status===404;return <div className="error-page"><Link to="/" className="wordmark" aria-label="Hotlah home"><BrandWordmark/></Link><h1>{missing?'This page wandered off.':'Let’s try that again.'}</h1><p>{missing?'Your next nail appointment is still out there.':'Hotlah couldn’t load this page. Please refresh or return to discovery.'}</p><Link to="/" className="button primary">Back to discovery</Link></div>;}
