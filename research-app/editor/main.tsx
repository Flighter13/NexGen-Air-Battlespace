import React,{useState} from 'react';import{createRoot}from'react-dom/client';
import{catalog}from'../src/data/catalog';import{collectionSchemas,validateRecord,type Collection}from'./validation';
import './style.css';
const collections=Object.keys(collectionSchemas) as Collection[];
function Editor(){
 const [collection,setCollection]=useState<Collection>('entities');
 const [record,setRecord]=useState('');
 const [draft,setDraft]=useState('{}');
 const [message,setMessage]=useState('');
 const [ready,setReady]=useState(false);
 const [filename,setFilename]=useState('');
 const rows=catalog[collection] as Array<{id:string}>;
 const pick=(id:string)=>{const item=rows.find(r=>r.id===id);setRecord(id);setDraft(JSON.stringify(item??{},null,2));setMessage('');setReady(false);setFilename(id+'.json')};
 const validate=()=>{try{const data=JSON.parse(draft);const result=validateRecord(collection,data);setReady(result.ok);setFilename((typeof data.id==='string'?data.id:'untitled')+'.json');setMessage(result.ok?'Valid schema and references. You may export a reviewed JSON file.':result.errors.join('\n'))}catch(e){setReady(false);setMessage('Invalid JSON: '+String(e))}};
 const exportFile=()=>{if(!ready)return;const data=JSON.stringify(JSON.parse(draft),null,2)+'\n';const url=URL.createObjectURL(new Blob([data],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)};
 const loadFile=(file:File|undefined)=>{if(!file)return;file.text().then(t=>{setDraft(t);setRecord('');setReady(false);setFilename(file.name);setMessage('Imported. Validate before exporting.')})};
 return <main><header><h1>NexGen · Research Authoring</h1><p>Local-only drafting workspace. Export files for review and commit through Git; nothing is published automatically.</p></header><section className="layout"><aside><label>Collection<select aria-label="Collection" value={collection} onChange={e=>{setCollection(e.target.value as Collection);setRecord('');setDraft('{}');setMessage('');setReady(false)}}>{collections.map(k=><option key={k}>{k}</option>)}</select></label><button onClick={()=>{setRecord('');setDraft(JSON.stringify({id:'new-record'},null,2));setReady(false);setMessage('New draft: complete required schema fields.') }}>New record</button><div className="records">{rows.map(row=><button key={row.id} aria-pressed={record===row.id} onClick={()=>pick(row.id)}>{row.id}</button>)}</div></aside><article><label htmlFor="json-editor">JSON research record</label><textarea id="json-editor" spellCheck={false} value={draft} onChange={e=>{setDraft(e.target.value);setReady(false)}}/><div className="actions"><button onClick={validate}>Validate draft</button><button disabled={!ready} onClick={exportFile}>Export validated JSON</button><label className="import">Import JSON<input type="file" accept=".json,application/json" onChange={e=>loadFile(e.target.files?.[0])}/></label></div><pre role="status">{message||'Choose a record or create a new draft.'}</pre><p className="note">After export, place the reviewed file under <code>research-app/data/{collection}/</code>, run <code>npm test</code> and <code>npm run build</code>, then commit. Replacing an existing ID is supported; importing does not write to your repository.</p></article></section></main>
}
createRoot(document.getElementById('root')!).render(<Editor/>);
