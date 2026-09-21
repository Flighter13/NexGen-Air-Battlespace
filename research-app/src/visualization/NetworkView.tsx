import { useMemo } from 'react';
import { forceX, forceY, forceCollide, forceLink, forceManyBody, forceSimulation, type SimulationNodeDatum } from 'd3-force';
import type { Snapshot } from '../engine/timeline';
import { assetUrl } from '../components/EntityImage';
import type { Relationship } from '../data/schema';

type Node = SimulationNodeDatum & { id:string; label:string; entityId:string; icon:string; lane:string; };
const laneOrder=['isr','battle-management','fighter','cca','electronic-warfare','tanker','bomber','transport','autonomy-test','other'];
const laneSortIndex=(lane:string)=>{const index=laneOrder.indexOf(lane); return index===-1?laneOrder.length:index;};
const viewBoxWidth=900;
const viewBoxMinHeight=520;
const laneStartY=105;
const laneSpacing=95;
const laneBottomPadding=95;

export function NetworkView({state,layoutState,allRelationships,onSelect,selected,relationshipTypes}:{
  state:Snapshot; layoutState:Snapshot; allRelationships:Relationship[];
  onSelect:(id:string)=>void; selected:string; relationshipTypes:string[];
}) {
  const {nodes,viewBoxHeight}=useMemo(()=>{
    const visibleActors=layoutState.actors.filter((a)=>a.entity.visualization.network);
    const nodes:Node[]=visibleActors.map((a)=>({id:a.id,label:a.label,entityId:a.entityId,icon:assetUrl(a.entity.media?.icon ?? 'assets/entities/uncrewed.svg'),lane:a.entity.function}));
    const nodeIds=new Set(nodes.map((n)=>n.id));
    const links=allRelationships.filter((r)=>nodeIds.has(r.from)&&nodeIds.has(r.to)).map((r)=>({source:r.from,target:r.to}));
    const activeLanes=[...new Set(nodes.map((n)=>n.lane))].sort((a,b)=>laneSortIndex(a)-laneSortIndex(b));
    const maxLaneSize=Math.max(0,...activeLanes.map((lane)=>nodes.filter((n)=>n.lane===lane).length));
    const centers=new Map(nodes.map((n)=>{
      const laneIndex=Math.max(0,activeLanes.findIndex((lane)=>lane===n.lane));
      const laneMembers=nodes.filter((m)=>m.lane===n.lane);
      const memberIndex=laneMembers.findIndex((m)=>m.id===n.id);
      return [n.id,{x:110+(laneIndex*680)/Math.max(1,activeLanes.length-1),y:laneStartY+memberIndex*laneSpacing}] as const;
    }));
    nodes.forEach((n)=>{const c=centers.get(n.id)!;n.x=c.x;n.y=c.y;});
    const sim=forceSimulation(nodes)
      .force('link',forceLink<Node,any>(links).id((d)=>d.id).distance(170).strength(0.05))
      .force('charge',forceManyBody().strength(-90))
      .force('collision',forceCollide(58))
      .force('x',forceX<Node>((n)=>centers.get(n.id)!.x).strength(0.75))
      .force('y',forceY<Node>((n)=>centers.get(n.id)!.y).strength(0.45))
      .stop();
    for(let i=0;i<180;i++) sim.tick();
    return {nodes,viewBoxHeight:Math.max(viewBoxMinHeight,laneStartY+Math.max(0,maxLaneSize-1)*laneSpacing+laneBottomPadding)};
  },[layoutState.actors.map((a)=>a.id).join('|'),allRelationships]);

  const activeRelationships=state.relationships.filter((r)=>relationshipTypes.includes(r.type));
  return <svg className="network" viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`} role="img" aria-label="Mission system-of-systems relationship network">
    <defs><marker id="arrow" viewBox="0 0 10 10" refX="22" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor"/></marker></defs>
    {activeRelationships.map((r)=>{
      const a=nodes.find((n)=>n.id===r.from), b=nodes.find((n)=>n.id===r.to); if(!a||!b)return null;
      const dash=r.type==='logistics'||r.type==='refueling'?'7 6':r.type==='data'||r.type==='sensor'?'3 4':undefined;
      return <g key={r.id} className={`edge edge-${r.type}`}>
        <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="currentColor" strokeWidth="2" strokeDasharray={dash} markerEnd="url(#arrow)"/>
        {r.direction==='bidirectional'&&<line x1={b.x} y1={b.y} x2={a.x} y2={a.y} stroke="currentColor" strokeWidth="1" strokeDasharray={dash} markerEnd="url(#arrow)" opacity="0.55"/>}
        <text x={(a.x!+b.x!)/2} y={(a.y!+b.y!)/2-12} textAnchor="middle" className="edge-label">{r.label}</text>
      </g>;
    })}
    {nodes.filter((n)=>state.actors.some((a)=>a.id===n.id)).map((n)=><g key={n.id} role="button" tabIndex={0} aria-label={`Open ${n.label} profile`} onClick={()=>onSelect(n.id)} onKeyDown={(e)=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSelect(n.id);}}} transform={`translate(${n.x},${n.y})`} className="network-node">
      <circle r="27" fill={n.id===selected?'#68ded2':'#213e4c'} stroke="#68ded2"/><image href={n.icon} x="-20" y="-22" width="40" height="44"/><text textAnchor="middle" y="52">{n.label}</text><text textAnchor="middle" y="68" className="node-function">{n.lane}</text>
    </g>)}
  </svg>;
}
