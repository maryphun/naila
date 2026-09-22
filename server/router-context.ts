import { createContext } from 'react-router';
import type { Env } from './env';
export const cloudflareContext=createContext<{env:Env;ctx:ExecutionContext}>();
