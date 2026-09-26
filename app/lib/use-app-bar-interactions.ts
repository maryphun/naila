import {useEffect,useRef,useState} from 'react';

type PullPhase='idle'|'pulling'|'ready'|'refreshing';

const pullThreshold=100;
const directionThresholdDown=12;
const directionThresholdUp=6;

export function useAppBarInteractions(routeKey:string,onRefresh:()=>Promise<void>){
  const shellRef=useRef<HTMLDivElement>(null);
  const headerRef=useRef<HTMLElement>(null);
  const [headerHidden,setHeaderHidden]=useState(false);
  const [pullPhase,setPullPhase]=useState<PullPhase>('idle');
  const hiddenRef=useRef(false);
  const phaseRef=useRef<PullPhase>('idle');
  const refreshRef=useRef(onRefresh);
  const resetPullRef=useRef<()=>void>(()=>{});
  refreshRef.current=onRefresh;

  useEffect(()=>{
    let lastY=Math.max(0,window.scrollY),direction=0,distance=0,frame=0;
    const update=()=>{
      frame=0;
      const y=Math.max(0,window.scrollY);
      const delta=y-lastY;
      if(y<=2){
        direction=0;distance=0;
        if(hiddenRef.current){hiddenRef.current=false;setHeaderHidden(false);}
      }else if(delta!==0){
        const nextDirection=Math.sign(delta);
        if(nextDirection!==direction){direction=nextDirection;distance=0;}
        distance+=Math.abs(delta);
        if(direction>0&&y>(headerRef.current?.offsetHeight??0)&&distance>=directionThresholdDown&&!hiddenRef.current){
          hiddenRef.current=true;setHeaderHidden(true);
        }else if(direction<0&&distance>=directionThresholdUp&&hiddenRef.current){
          hiddenRef.current=false;setHeaderHidden(false);
        }
      }
      lastY=y;
    };
    const onScroll=()=>{if(!frame)frame=window.requestAnimationFrame(update);};
    window.addEventListener('scroll',onScroll,{passive:true});
    return()=>{window.removeEventListener('scroll',onScroll);if(frame)window.cancelAnimationFrame(frame);};
  },[]);

  useEffect(()=>{
    let gesture:{startX:number;startY:number;raw:number;pulling:boolean;reducedMotion:boolean}|null=null;
    let paintFrame=0,queuedDistance=0,settleTimer=0,releaseTimer=0,refreshId=0;
    const setPhase=(next:PullPhase)=>{
      if(phaseRef.current!==next){phaseRef.current=next;setPullPhase(next);}
    };
    const paint=(value:number)=>{
      shellRef.current?.style.setProperty('--pull-distance',`${value}px`);
      const progress=Math.min(1,value/55);
      shellRef.current?.style.setProperty('--pull-progress',String(progress));
      shellRef.current?.style.setProperty('--pull-rotation',`${progress*180}deg`);
    };
    const queuePaint=(value:number)=>{
      queuedDistance=value;
      if(!paintFrame)paintFrame=window.requestAnimationFrame(()=>{paintFrame=0;paint(queuedDistance);});
    };
    const stopPaint=()=>{if(paintFrame){window.cancelAnimationFrame(paintFrame);paintFrame=0;}};
    const stopMove=()=>document.removeEventListener('touchmove',onMove);
    const settle=(reducedMotion:boolean)=>{
      stopPaint();shellRef.current?.removeAttribute('data-pulling');paint(0);
      if(releaseTimer)window.clearTimeout(releaseTimer);
      if(reducedMotion)shellRef.current?.removeAttribute('data-pull-active');
      else releaseTimer=window.setTimeout(()=>{releaseTimer=0;shellRef.current?.removeAttribute('data-pull-active');},260);
    };
    const reset=()=>{
      gesture=null;refreshId++;
      stopMove();
      if(settleTimer){window.clearTimeout(settleTimer);settleTimer=0;}
      if(releaseTimer){window.clearTimeout(releaseTimer);releaseTimer=0;}
      stopPaint();shellRef.current?.removeAttribute('data-pulling');shellRef.current?.removeAttribute('data-pull-active');
      setPhase('idle');paint(0);
    };
    resetPullRef.current=reset;
    const onStart=(event:TouchEvent)=>{
      if(event.touches.length!==1){if(gesture)reset();return;}
      if(window.scrollY>0||phaseRef.current==='refreshing')return;
      const target=event.target;
      if(target instanceof Element&&target.closest('dialog,[role="dialog"],.bottom-nav,.style-strip,input,textarea,select,[contenteditable="true"]'))return;
      const touch=event.touches[0];
      gesture={startX:touch.clientX,startY:touch.clientY,raw:0,pulling:false,reducedMotion:window.matchMedia('(prefers-reduced-motion: reduce)').matches};
      document.addEventListener('touchmove',onMove,{passive:false});
    };
    const onMove=(event:TouchEvent)=>{
      if(!gesture)return;
      if(event.touches.length!==1){reset();return;}
      const touch=event.touches[0];
      const dx=touch.clientX-gesture.startX,dy=touch.clientY-gesture.startY;
      if(dy<=0){if(gesture.pulling)reset();else{gesture=null;stopMove();}return;}
      if(Math.abs(dx)*1.25>=dy){if(Math.abs(dx)>6){gesture=null;stopMove();}return;}
      if(window.scrollY>0){reset();return;}
      event.preventDefault();
      if(dy<6)return;
      if(!gesture.pulling){
        gesture.pulling=true;
        if(releaseTimer){window.clearTimeout(releaseTimer);releaseTimer=0;}
        shellRef.current?.setAttribute('data-pull-active','');shellRef.current?.setAttribute('data-pulling','');
      }
      gesture.raw=dy;
      const distance=Math.min(gesture.reducedMotion?32:72,dy*(gesture.reducedMotion?.26:.55));
      queuePaint(distance);
      setPhase(dy>=pullThreshold?'ready':'pulling');
    };
    const onEnd=()=>{
      if(!gesture)return;
      stopMove();
      const shouldRefresh=gesture.pulling&&gesture.raw>=pullThreshold;
      const reducedMotion=gesture.reducedMotion;
      gesture=null;stopPaint();shellRef.current?.removeAttribute('data-pulling');
      if(!shouldRefresh){setPhase('idle');settle(reducedMotion);return;}
      setPhase('refreshing');paint(reducedMotion?24:55);
      const id=++refreshId,started=performance.now();
      void refreshRef.current().finally(()=>{
        if(id!==refreshId)return;
        settleTimer=window.setTimeout(()=>{
          if(id!==refreshId)return;
          settleTimer=0;setPhase('idle');settle(reducedMotion);
        },Math.max(0,240-(performance.now()-started)));
      });
    };
    document.addEventListener('touchstart',onStart,{passive:true});
    document.addEventListener('touchend',onEnd,{passive:true});
    document.addEventListener('touchcancel',reset,{passive:true});
    return()=>{
      document.removeEventListener('touchstart',onStart);
      stopMove();
      document.removeEventListener('touchend',onEnd);
      document.removeEventListener('touchcancel',reset);
      reset();
    };
  },[]);

  useEffect(()=>{
    hiddenRef.current=false;setHeaderHidden(false);
    resetPullRef.current();
  },[routeKey]);

  return {shellRef,headerRef,headerHidden,pullPhase};
}
