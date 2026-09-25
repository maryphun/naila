import type { Service } from './types';

export type Catalog = {services:Service[]};

const catalogReuseMs=30000;
let recentCatalog:{value:Catalog;at:number}|null=null;

export function getRecentCatalog():Catalog|null {
  return recentCatalog&&Date.now()-recentCatalog.at<catalogReuseMs?recentCatalog.value:null;
}

export function rememberCatalog(value:Catalog):void {
  if(recentCatalog?.value.services===value.services)return;
  recentCatalog={value,at:Date.now()};
}
