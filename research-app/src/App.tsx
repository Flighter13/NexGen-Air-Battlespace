import { useMemo, useState } from 'react';
import { catalog } from './data/catalog';
import type { Scenario } from './data/schema';
import { snapshot, filterSnapshot } from './engine/timeline';
import { useTimeline } from './engine/useTimeline';
import { MapView } from './visualization/MapView';
import { NetworkView } from './visualization/NetworkView';
import { Timeline } from './components/Timeline';
import { EntityCard } from './components/EntityCard';
import { Provenance } from './components/Provenance';
import { EntityImage } from './components/EntityImage';
import { GroupControls } from './components/GroupControls';

const RELATIONSHIP_TYPES=['command','data','sensor','coordination','support','refueling','electronic-warfare','autonomy','logistics'];

export default function App(){
  const [scenarioId,setScenarioId]=useState(catalog.scenarios[0].id);
  const scenario=catalog.scenarios.find((s)=>s.id===scenarioId)!;
  return <>
    <header className="masthead"><div className="brand"><span className="brand-mark">N↗</span><div><h1>NexGen <span>Air Battlespace</span></h1><p>PUBLIC RESEARCH ATLAS</p></div></div><span className="header-note"><i/> Research & visualization</span></header>
    <Workspace key={scenarioId} scenario={scenario} onScenario={setScenarioId}/>
    <footer>Independent research project · Interpretations do not represent official statements by any organization. Illustrative motion does not model aircraft performance.</footer>
  </>;
}

function Workspace({scenario,onScenario}:{scenario:Scenario;onScenario:(id:string)=>void;}){
  const clock=useTimeline(scenario.duration), state=snapshot(scenario,clock.time,catalog);
  const [view,setView]=useState<'map'|'network'>('map');
  const [selected,setSelected]=useState(state.actors[0].entityId);
  const [query,setQuery]=useState('');
  const [showLinks,setShowLinks]=useState(true);
  const [selectedActor,setSelectedActor]=useState(state.actors[0].id);
  const [hiddenGroups,setHiddenGroups]=useState<string[]>([]);
  const [focusGroup,setFocusGroup]=useState<string|null>(null);
  const [domain,setDomain]=useState('all');
  const [functionFilter,setFunctionFilter]=useState('all');
  const [relationshipTypes,setRelationshipTypes]=useState<string[]>(RELATIONSHIP_TYPES);

  const selectActor=(actorId:string)=>{const actor=state.actors.find((a)=>a.id===actorId);if(actor){setSelectedActor(actorId);setSelected(actor.entityId);}};
  const filtered=filterSnapshot(state,hiddenGroups,focusGroup);
  const allRelationships=useMemo(()=>catalog.relationships.filter((r)=>r.scenarioId===scenario.id),[scenario.id]);
  const displayed={...filtered,relationships:showLinks?filtered.relationships.filter((r)=>relationshipTypes.includes(r.type)):[]};
  const entity=catalog.entities.find((e)=>e.id===selected)!;
  const library=catalog.entities.filter((e)=>e.name.toLowerCase().includes(query.toLowerCase())&&(domain==='all'||e.domain===domain)&&(functionFilter==='all'||e.function===functionFilter));

  return <main className="workspace">
    <aside className="research-sidebar">
      <div className="eyebrow">01 / RESEARCH SCENARIOS</div><label className="field-label" htmlFor="scenario">Explore a concept</label>
      <select id="scenario" value={scenario.id} onChange={(e)=>onScenario(e.target.value)}>{catalog.scenarios.map((s)=><option key={s.id} value={s.id}>{s.title}</option>)}</select>
      <p className="scenario-description">{scenario.description}</p><span className="badge illustrative">Illustrative scenario</span><Provenance citations={scenario.citations}/>
      <details className="assumptions"><summary>Reading this visualization</summary><ul>{scenario.assumptions.map((a)=><li key={a}>{a}</li>)}</ul></details>
      <div className="section-divider"/><div className="eyebrow">02 / ENTITY LIBRARY</div>
      <input aria-label="Search entities" placeholder="Search research records…" value={query} onChange={(e)=>setQuery(e.target.value)}/>
      <div className="library-filters">
        <select aria-label="Filter by domain" value={domain} onChange={(e)=>setDomain(e.target.value)}><option value="all">All domains</option><option value="air">Air</option><option value="network">Network</option><option value="space">Space</option><option value="ground">Ground</option><option value="maritime">Maritime</option></select>
        <select aria-label="Filter by function" value={functionFilter} onChange={(e)=>setFunctionFilter(e.target.value)}><option value="all">All functions</option>{[...new Set(catalog.entities.map((e)=>e.function))].sort().map((f)=><option key={f} value={f}>{f}</option>)}</select>
      </div>
      <div className="entity-list">{library.map((e)=><button key={e.id} className={selected===e.id?'entity-row selected':'entity-row'} onClick={()=>{setSelected(e.id);setSelectedActor('');}}><EntityImage small entity={e}/><span>{e.shortName}<small>{e.domain} · {e.function}{state.actors.some((a)=>a.entityId===e.id)?' · in scenario':' · library'}</small></span><span className="row-arrow">↗</span></button>)}</div>
    </aside>

    <section className="center">
      <div className="view-heading"><div><div className="eyebrow">CONCEPT EXPLORER</div><h2>{scenario.subtitle}</h2></div><div className="segmented" aria-label="Visualization view"><button aria-pressed={view==='map'} className={view==='map'?'active':''} onClick={()=>setView('map')}>Geographic</button><button aria-pressed={view==='network'} className={view==='network'?'active':''} onClick={()=>setView('network')}>Network</button></div></div>
      <div className="relationship-filters" aria-label="Relationship layers">{RELATIONSHIP_TYPES.map((type)=><label key={type}><input type="checkbox" checked={relationshipTypes.includes(type)} onChange={()=>setRelationshipTypes((current)=>current.includes(type)?current.filter((t)=>t!==type):[...current,type])}/>{type}</label>)}</div>
      <div className="visualization">
        <div className="map-label"><span className="live-dot"/> {view==='map'?'Fictional study geography':'Mission system-of-systems'}<small>{displayed.actors.length} / {state.actors.length} visible actors · {displayed.relationships.length} active links</small></div>
        {view==='map'?<MapView state={displayed} selected={selectedActor} onSelect={selectActor}/>:<NetworkView state={displayed} layoutState={state} allRelationships={allRelationships} selected={selectedActor} onSelect={selectActor} relationshipTypes={relationshipTypes}/>}
        <div className="legend"><span>● Research actor</span><span className="gold">━ Active relationship</span><label><input type="checkbox" checked={showLinks} onChange={(e)=>setShowLinks(e.target.checked)}/> Show links</label></div>
      </div>
      <div className="phase-narrative"><span className="eyebrow">{state.phase.title}</span><p>{state.phase.narrative}</p></div><Timeline scenario={scenario} clock={clock}/>
      <GroupControls state={state} hidden={hiddenGroups} focus={focusGroup} selectedActor={selectedActor} onToggle={(id)=>{setHiddenGroups((h)=>h.includes(id)?h.filter((g)=>g!==id):[...h,id]);if(focusGroup===id)setFocusGroup(null);}} onFocus={(id)=>{setFocusGroup(id);if(id)setHiddenGroups((h)=>h.filter((g)=>g!==id));}} onSelect={selectActor}/>
      <section className="relationship-panel"><div className="eyebrow">ACTIVE RELATIONSHIPS</div>{displayed.relationships.length?displayed.relationships.map((r)=><details key={r.id}><summary>{r.label} <span className={`badge ${r.evidence}`}>{r.evidence}</span></summary><p>{state.actors.find((a)=>a.id===r.from)?.label} {r.direction==='bidirectional'?'↔':'→'} {state.actors.find((a)=>a.id===r.to)?.label} · {r.type}{r.networkId?` · ${catalog.networks.find((n)=>n.id===r.networkId)?.name}`:''}</p><Provenance citations={r.citations}/></details>):<p className="muted">No relationships active in this phase.</p>}</section>
    </section>

    <aside className="profile-sidebar"><EntityCard entity={entity}/><section className="roles"><div className="eyebrow">SCENARIO ROLES</div>{state.actors.filter((a)=>a.entityId===selected).map((a)=><p key={a.id}><strong>{a.label}</strong><br/>{a.role}</p>)}{!state.actors.some((a)=>a.entityId===selected)&&<p className="muted">This library record is not assigned to the current scenario.</p>}</section></aside>
  </main>;
}
