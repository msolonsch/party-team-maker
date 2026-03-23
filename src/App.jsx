import { useState, useEffect, useCallback } from "react";

const DRAFT_KEY = "birthday-party-v3";
async function saveDraft(data) { try { await window.storage.set(DRAFT_KEY, JSON.stringify(data)); } catch(e){} }
async function loadDraft() { try { const r = await window.storage.get(DRAFT_KEY); return r ? JSON.parse(r.value) : null; } catch(e){ return null; } }
async function clearDraft() { try { await window.storage.delete(DRAFT_KEY); } catch(e){} }

const DEFAULT_CATS = [
  { id:"class", label:"Same Class", emoji:"🏫", q:"Who's coming from your class?" },
  { id:"other_school", label:"Other Classes", emoji:"📚", q:"Any friends from other classes at school?" },
  { id:"preschool", label:"Pre-school Friends", emoji:"🌈", q:"What about old friends from pre-school?" },
  { id:"sport", label:"Sport Friends", emoji:"⚽", q:"Anyone from your sports team or club?" },
  { id:"siblings", label:"Siblings of Guests", emoji:"👫", q:"Are any brothers or sisters of guests coming?" },
  { id:"relatives", label:"Relatives", emoji:"🏠", q:"Any cousins or other family coming?" },
  { id:"other", label:"Other Friends", emoji:"🎈", q:"Anyone else we've missed?" },
];

const COLORS = ["#FF6B9D","#4ECDC4","#FFB347","#7B68EE","#06D6A0","#EF476F","#F72585","#4361EE","#FB8500","#2DC653"];

const css = `
  @import url('https://fonts.googleapis.com/css2?family=Fredoka+One&family=Nunito:wght@400;600;700;800&display=swap');
  *{box-sizing:border-box;} body{margin:0;background:linear-gradient(160deg,#fff9f0,#fff0f9 50%,#f0f5ff);min-height:100vh;}
  .bh:hover{transform:translateY(-2px);filter:brightness(1.05);} .bh:active{transform:translateY(0);}
  .fade{animation:fadeIn 0.3s ease;}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
  @keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
  @keyframes bounce{0%,100%{transform:translateY(0);}50%{transform:translateY(-10px);}}
  @media print{.no-print{display:none!important;} body{background:white!important;}}
`;

export default function App() {
  // Session
  const [screen, setScreen] = useState("welcome");
  const [hasDraft, setHasDraft] = useState(false);
  const [savedAt, setSavedAt] = useState(null);

  // Config
  const [mode, setMode] = useState(null);
  const [birthdayName, setBirthdayName] = useState("");
  const [teamMin, setTeamMin] = useState(3);
  const [teamMax, setTeamMax] = useState(5);
  const [numTeams, setNumTeams] = useState(null);
  const [philosophy, setPhilosophy] = useState(null);
  const [useGender, setUseGender] = useState(false);

  // Categories
  const [allCats, setAllCats] = useState(DEFAULT_CATS);
  const [selectedCats, setSelectedCats] = useState([]);
  const [customCatInput, setCustomCatInput] = useState("");

  // Kids entry
  const [kids, setKids] = useState([]);
  const [catIndex, setCatIndex] = useState(0);
  const [nameInput, setNameInput] = useState("");
  const [ageFlag, setAgeFlag] = useState("same");
  const [genderFlag, setGenderFlag] = useState("?");
  const [editingKid, setEditingKid] = useState(null);
  const [pasteInput, setPasteInput] = useState("");
  const [showPaste, setShowPaste] = useState(false);
  const [pastePreview, setPastePreview] = useState([]);

  // Picks & orphans
  const [picks, setPicks] = useState([]);
  const [orphans, setOrphans] = useState([]);
  const [orphanChoices, setOrphanChoices] = useState({});

  // Team names
  const [teamNames, setTeamNames] = useState([]);
  const [namingMode, setNamingMode] = useState(null); // "self" | "ai"
  const [namingLoading, setNamingLoading] = useState(false);

  // Teams & results
  const [teams, setTeams] = useState([]);
  const [generalNote, setGeneralNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [debugInfo, setDebugInfo] = useState("");
  const [warnings, setWarnings] = useState([]);
  const [showBackWarning, setShowBackWarning] = useState(false);
  const [backTarget, setBackTarget] = useState(null);

  // Changes
  const [swapKid, setSwapKid] = useState(null);
  const [newKidName, setNewKidName] = useState("");
  const [newKidTeamIdx, setNewKidTeamIdx] = useState(0);

  useEffect(() => {
    const s = document.createElement("style"); s.textContent = css; document.head.appendChild(s);
    loadDraft().then(d => { if (d?.birthdayName) { setHasDraft(true); setSavedAt(d.savedAt||null); } });
  }, []);

  // Auto-save
  const draftData = useCallback(() => ({
    screen, mode, birthdayName, teamMin, teamMax, numTeams, philosophy, useGender,
    allCats, selectedCats, kids, catIndex, picks, orphanChoices, teamNames, namingMode,
    teams, generalNote, errorMsg, debugInfo,
    savedAt: new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"}),
  }), [screen, mode, birthdayName, teamMin, teamMax, numTeams, philosophy, useGender, allCats, selectedCats, kids, catIndex, picks, orphanChoices, teamNames, namingMode, teams, generalNote, errorMsg, debugInfo]);

  useEffect(() => {
    if (birthdayName || kids.length > 0) {
      const d = draftData(); setSavedAt(d.savedAt); saveDraft(d);
    }
  }, [draftData, birthdayName, kids, screen, errorMsg]);

  const restoreDraft = async () => {
    const d = await loadDraft(); if (!d) return;
    setMode(d.mode); setBirthdayName(d.birthdayName||""); setTeamMin(d.teamMin||3); setTeamMax(d.teamMax||5);
    setNumTeams(d.numTeams||null); setPhilosophy(d.philosophy); setUseGender(d.useGender||false);
    setAllCats(d.allCats||DEFAULT_CATS); setSelectedCats(d.selectedCats||[]);
    setKids(d.kids||[]); setCatIndex(d.catIndex||0); setPicks(d.picks||[]);
    setOrphanChoices(d.orphanChoices||{}); setTeamNames(d.teamNames||[]); setNamingMode(d.namingMode||null);
    setTeams(d.teams||[]); setGeneralNote(d.generalNote||"");
    if (d.errorMsg) { setErrorMsg(d.errorMsg); setDebugInfo(d.debugInfo||""); }
    setHasDraft(false);
    setScreen(d.screen||"step0");
  };

  // Computed
  const activeCats = allCats.filter(c => selectedCats.includes(c.id));
  const totalKids = kids.length + 1;

  const calcOptimalTeams = (total, min, max) => {
    let n = Math.round(total / ((min + max) / 2));
    while (n * max < total) n++;
    while (n > 1 && n * min > total) n--;
    return Math.max(2, n);
  };

  const validateTeamCount = (n, total, min, max) => {
    if (n * max < total) return `Not enough room — ${n} teams of max ${max} only fits ${n*max} kids. Try ${Math.ceil(total/max)} or more teams.`;
    if (n * min > total) return `Too many teams — ${n} teams need at least ${n*min} kids. Try ${Math.floor(total/min)} or fewer teams.`;
    return null;
  };

  // Styles
  const F = "'Nunito',sans-serif";
  const S = {
    wrap: {maxWidth:560,margin:"0 auto",padding:"20px 16px 60px",fontFamily:F},
    card: {background:"white",borderRadius:24,padding:"20px 20px 24px",boxShadow:"0 4px 24px rgba(0,0,0,0.07)",marginBottom:14},
    h1: {fontFamily:"'Fredoka One',cursive",fontSize:"2rem",color:"#FF6B9D",margin:"0 0 4px"},
    h2: {fontFamily:"'Fredoka One',cursive",fontSize:"1.5rem",color:"#333",margin:"0 0 4px"},
    sub: {color:"#999",fontSize:"0.88rem",margin:"0 0 14px",lineHeight:1.5},
    btn: (bg="#FF6B9D",col="white",ex={}) => ({background:bg,color:col,border:"none",borderRadius:14,padding:"11px 18px",fontSize:"0.9rem",fontWeight:800,fontFamily:F,cursor:"pointer",transition:"all 0.15s",...ex}),
    bigBtn: (a) => ({display:"block",width:"100%",padding:"12px 14px",borderRadius:16,border:`3px solid ${a?"#FF6B9D":"#FFE0EE"}`,background:a?"#FFF0F7":"#FAFAFA",color:"#333",fontSize:"0.9rem",fontWeight:700,fontFamily:F,cursor:"pointer",marginBottom:8,textAlign:"left",transition:"all 0.15s"}),
    inp: {width:"100%",padding:"11px 13px",borderRadius:14,border:"2px solid #FFD6E7",fontSize:"0.9rem",fontFamily:F,outline:"none"},
    tag: (bg,col,bdr) => ({display:"inline-flex",alignItems:"center",gap:3,padding:"5px 11px",borderRadius:20,fontSize:"0.83rem",fontWeight:700,margin:"3px",background:bg,color:col,border:`2px solid ${bdr}`,cursor:"pointer"}),
    lbl: {fontWeight:800,color:"#777",fontSize:"0.76rem",display:"block",marginBottom:5,letterSpacing:"0.04em"},
    row: {display:"flex",gap:8,alignItems:"center"},
    saveBar: {textAlign:"center",fontSize:"0.73rem",color:"#ccc",marginBottom:6,fontWeight:600},
    stickyNav: {display:"flex",gap:8,marginBottom:12,position:"sticky",top:0,background:"white",paddingTop:4,paddingBottom:10,zIndex:10,borderBottom:"1px solid #FFE8F2"},
  };

  const AllScreens = ["welcome","step0","step1","step2","step3","step4","step5","step6","step7","step8","step9","step10"];
  const sIdx = AllScreens.indexOf(screen);

  const Progress = () => (
    <div style={{display:"flex",gap:4,marginBottom:6}} className="no-print">
      {[...Array(10)].map((_,i)=>(
        <div key={i} style={{height:6,flex:1,borderRadius:3,background:i<sIdx?"#FF6B9D":"#FFE0EE",transition:"background 0.3s"}}/>
      ))}
    </div>
  );

  const SaveBar = () => savedAt ? <div style={S.saveBar} className="no-print">✓ Saved at {savedAt}</div> : null;
  const Counter = () => <div style={{background:"#FFF0F7",borderRadius:20,padding:"4px 12px",fontSize:"0.8rem",fontWeight:800,color:"#FF6B9D"}}>🎉 {totalKids} guest{totalKids!==1?"s":""}</div>;

  // Navigation with back-warning for results screen
  const navTo = (target) => {
    if (screen === "step9" || screen === "step10") {
      setBackTarget(target); setShowBackWarning(true);
    } else {
      setScreen(target);
    }
  };

  const confirmBack = () => {
    setTeams([]); setGeneralNote(""); setErrorMsg(null); setDebugInfo("");
    setShowBackWarning(false); setScreen(backTarget);
  };

  // Category helpers
  const toggleCat = (id) => setSelectedCats(p => p.includes(id) ? p.filter(x=>x!==id) : [...p,id]);
  const addCustomCat = () => {
    if (!customCatInput.trim()) return;
    const id = "c_"+Date.now();
    setAllCats(p=>[...p,{id,label:customCatInput.trim(),emoji:"✨",q:`Who's coming from ${customCatInput.trim()}?`}]);
    setSelectedCats(p=>[...p,id]); setCustomCatInput("");
  };

  // Kid helpers
  const parsePaste = (text) => text.split(/[,\n]/).map(s=>s.trim())
    .filter(s=>s.length>0&&s.length<40&&/^[a-zA-Z\s\-\'àáâãäåæçèéêëìíîïðñòóôõöùúûüýÿÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖÙÚÛÜÝ]+$/.test(s));

  const previewPaste = () => setPastePreview(parsePaste(pasteInput).filter(n=>!kids.some(k=>k.name===n)));
  const commitPaste = () => {
    const cat = activeCats[catIndex];
    setKids(p=>[...p,...pastePreview.map(name=>({name,category:cat.id,categoryLabel:cat.label,age:ageFlag,gender:useGender?genderFlag:"?"}))]);
    setPastePreview([]); setPasteInput(""); setShowPaste(false);
  };

  const addKid = () => {
    if (!nameInput.trim()) return;
    const cat = activeCats[catIndex];
    setKids(p=>[...p,{name:nameInput.trim(),category:cat.id,categoryLabel:cat.label,age:ageFlag,gender:useGender?genderFlag:"?"}]);
    setNameInput(""); setAgeFlag("same"); setGenderFlag("?");
  };
  const removeKid = (name) => setKids(p=>p.filter(k=>k.name!==name));
  const saveEdit = () => {
    setKids(p=>p.map(k=>k.name===editingKid.origName?{...k,...editingKid}:k));
    setEditingKid(null);
  };
  const resetCatState = () => { setNameInput(""); setAgeFlag("same"); setGenderFlag("?"); setPasteInput(""); setShowPaste(false); setPastePreview([]); };
  const nextCat = () => { resetCatState(); if (catIndex+1>=activeCats.length) setScreen("step5"); else setCatIndex(i=>i+1); };
  const prevCat = () => { resetCatState(); if (catIndex===0) setScreen("step3"); else setCatIndex(i=>i-1); };

  const togglePick = (name) => setPicks(p=>p.includes(name)?p.filter(n=>n!==name):p.length<2?[...p,name]:p);

  const detectOrphans = (kidsList) => {
    const counts={}; kidsList.forEach(k=>{counts[k.category]=(counts[k.category]||0)+1;});
    return kidsList.filter(k=>counts[k.category]===1);
  };

  const goToOrphansOrTeamCount = () => {
    const detected = detectOrphans(kids);
    setOrphans(detected);
    if (detected.length>0) setScreen("step6"); else setScreen("step7");
  };

  const checkWarnings = (tms, min, max) => {
    const w=[];
    tms.forEach(t=>{
      if (t.members.length<min) w.push(`⚠️ ${t.name} has ${t.members.length} kids — below minimum of ${min}.`);
      if (t.members.length>max) w.push(`⚠️ ${t.name} has ${t.members.length} kids — above maximum of ${max}.`);
    });
    setWarnings(w);
  };

  // Team name generation via AI
  const generateTeamNames = async (count) => {
    setNamingLoading(true);
    try {
      const res = await fetch("/.netlify/functions/anthropic", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514", max_tokens:300,
          messages:[{role:"user",content:`Generate exactly ${count} fun, age-appropriate team names for a children's birthday party. Use animals, fantasy creatures, colours, or fun themes. Return ONLY a JSON array of strings, nothing else. Example: ["Team Unicorn","Team Dragon"]`}]
        })
      });
      const data = await res.json();
      const text = data.content.filter(c=>c.type==="text").map(c=>c.text).join("").trim();
      const clean = text.replace(/```json|```/g,"").trim();
      const names = JSON.parse(clean);
      setTeamNames(names.slice(0,count));
    } catch(e) {
      setTeamNames([...Array(count)].map((_,i)=>`Team ${i+1}`));
    }
    setNamingLoading(false);
  };

  // Build teams
  const buildTeams = async () => {
    setLoading(true); setErrorMsg(null); setDebugInfo(""); setScreen("step9");
    const total = kids.length + 1;
    const n = numTeams || calcOptimalTeams(total, teamMin, teamMax);
    const kidList = kids.map(k=>`${k.name} (group:${k.categoryLabel}, age:${k.age}${useGender?`, gender:${k.gender}`:""})`).join("\n");
    const orphanInstr = Object.entries(orphanChoices).map(([name,dec])=>`${name}: ${dec==="mixed"?"place in most mixed team":"place wherever feels kindest"}`).join("\n")||"none";
    const names = teamNames.length>=n ? teamNames.slice(0,n) : [...Array(n)].map((_,i)=>teamNames[i]||`Team ${i+1}`);

    const prompt = `You are dividing children at a birthday party into balanced teams. Return ONLY valid JSON, no markdown, no extra text.

BIRTHDAY CHILD: ${birthdayName}
GUARANTEED TEAMMATES: ${picks.join(", ")||"none"}
PHILOSOPHY: ${philosophy==="mix"?"MIX — spread different groups across teams":"KEEP TOGETHER — keep friends with friends"}
BALANCE BY GENDER: ${useGender?"yes":"no"}
TOTAL GUESTS (including birthday child): ${total}
NUMBER OF TEAMS: exactly ${n}
TEAM SIZE: min ${teamMin}, max ${teamMax} per team
TEAM NAMES TO USE: ${names.join(", ")}

ALL GUESTS:
${kidList}

ORPHAN PLACEMENT:
${orphanInstr}

RULES:
- Create EXACTLY ${n} teams using EXACTLY these names: ${names.join(", ")}
- ${birthdayName} must be on "${names[0]}" with their guaranteed teammates
- Balance age across teams
- ${useGender?"Balance gender across teams":"Ignore gender"}
- Every team must have between ${teamMin} and ${teamMax} members — NO EXCEPTIONS
- ALL ${total} guests must appear exactly once across all teams
- Include ${birthdayName} in "${names[0]}" members

Return ONLY:
{"teams":[{"name":"string","members":["name1","name2"],"description":"one friendly sentence"}],"note":"warm short overall note"}`;

    try {
      const res = await fetch("/.netlify/functions/anthropic", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({model:"claude-sonnet-4-20250514", max_tokens:2500, messages:[{role:"user",content:prompt}]})
      });
      const raw = await res.text();
      setDebugInfo(raw.slice(0,600));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = JSON.parse(raw);
      if (data.error) throw new Error(`API: ${data.error.message}`);
      if (!data.content?.length) throw new Error("Empty response");
      const text = data.content.filter(c=>c.type==="text").map(c=>c.text).join("").trim();
      let json = text.replace(/```json\s*/g,"").replace(/```\s*/g,"").trim();
      const fb=json.indexOf("{"), lb=json.lastIndexOf("}");
      if (fb>0||lb<json.length-1) json=json.slice(fb,lb+1);
      const result = JSON.parse(json);
      if (!Array.isArray(result.teams)||result.teams.length===0) throw new Error("No teams in response");
      const styled = result.teams.map((t,i)=>({...t,color:COLORS[i%COLORS.length]}));
      setGeneralNote(result.note||""); setTeams(styled); checkWarnings(styled,teamMin,teamMax);
    } catch(e) { setErrorMsg(e.message||"Something went wrong."); }
    setLoading(false);
  };

  // Team edits
  const moveKid = (name, fromTeamIdx, toTeamIdx) => {
    const updated = teams.map((t,i)=>{
      if (i===fromTeamIdx) return {...t,members:t.members.filter(m=>m!==name)};
      if (i===toTeamIdx) return {...t,members:[...t.members,name]};
      return t;
    });
    setTeams(updated); checkWarnings(updated,teamMin,teamMax); setSwapKid(null);
  };
  const removeFromTeams = (name) => { const u=teams.map(t=>({...t,members:t.members.filter(m=>m!==name)})); setTeams(u); checkWarnings(u,teamMin,teamMax); };
  const addToTeam = () => {
    if (!newKidName.trim()) return;
    const u=teams.map((t,i)=>i===newKidTeamIdx?{...t,members:[...t.members,newKidName.trim()]}:t);
    setTeams(u); checkWarnings(u,teamMin,teamMax); setNewKidName("");
  };
  const updateTeamName = (idx,name) => setTeams(p=>p.map((t,i)=>i===idx?{...t,name}:t));

  // ===== SCREENS =====

  if (screen==="welcome") return (
    <div style={S.wrap}>
      <div style={{...S.card,textAlign:"center"}} className="fade">
        <div style={{fontSize:"3.5rem",animation:"bounce 1.8s infinite",marginBottom:6}}>🎂</div>
        <h1 style={{...S.h1,fontSize:"2.2rem"}}>Party Team Maker!</h1>
        <p style={{...S.sub,marginBottom:18}}>Split your birthday guests into perfectly balanced teams — fun, fair, and sorted in minutes!</p>
        {hasDraft && (
          <div style={{background:"#FFF8E7",border:"2px solid #FFD166",borderRadius:16,padding:16,marginBottom:16,textAlign:"left"}}>
            <div style={{fontWeight:800,color:"#B8860B",marginBottom:4}}>📋 Saved draft found{savedAt?` (${savedAt})`:""}</div>
            <p style={{fontSize:"0.83rem",color:"#888",margin:"0 0 10px"}}>Pick up where you left off — all your guests are saved.</p>
            <div style={{display:"flex",gap:8}}>
              <button className="bh" style={{...S.btn(),flex:1}} onClick={restoreDraft}>Continue →</button>
              <button className="bh" style={S.btn("#F0F0F0","#888",{flex:1})} onClick={async()=>{await clearDraft();setHasDraft(false);}}>Start fresh</button>
            </div>
          </div>
        )}
        <label style={S.lbl}>⭐ BIRTHDAY STAR'S NAME</label>
        <input style={{...S.inp,marginBottom:14}} placeholder="e.g. Sophia" value={birthdayName}
          onChange={e=>setBirthdayName(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&birthdayName.trim()&&setScreen("step0")} autoFocus/>
        {birthdayName.trim()&&<button className="bh" style={{...S.btn(),width:"100%"}} onClick={()=>setScreen("step0")}>Let's go! 🎉</button>}
      </div>
    </div>
  );

  if (screen==="step0") return (
    <div style={S.wrap}><Progress/><SaveBar/>
      <div style={S.card} className="fade">
        <div style={{fontSize:"2rem",marginBottom:6}}>👋</div>
        <h2 style={S.h2}>Who's using this today?</h2>
        <p style={S.sub}>Hi {birthdayName}! Are you doing this together or on your own?</p>
        {[{id:"together",icon:"👨‍👧",label:"Parent & birthday child together",desc:"Work through it as a team!"},
          {id:"parent",icon:"👩",label:"Parent only",desc:"Parent handles everything"},
          {id:"child",icon:"🧒",label:"Birthday child only",desc:"I've got this myself!"}].map(opt=>(
          <button key={opt.id} style={S.bigBtn(mode===opt.id)} onClick={()=>setMode(opt.id)}>
            <span style={{fontSize:"1.2rem",marginRight:8}}>{opt.icon}</span><strong>{opt.label}</strong>
            <div style={{fontSize:"0.76rem",color:"#aaa",marginTop:2}}>{opt.desc}</div>
          </button>
        ))}
        {mode&&<button className="bh" style={{...S.btn(),marginTop:4,width:"100%"}} onClick={()=>setScreen("step1")}>Next →</button>}
      </div>
    </div>
  );

  if (screen==="step1") return (
    <div style={S.wrap}><Progress/><SaveBar/>
      <div style={S.card} className="fade">
        <div style={{fontSize:"2rem",marginBottom:6}}>👥</div>
        <h2 style={S.h2}>How big should each team be?</h2>
        <p style={S.sub}>Set a min and max — we'll work out the right number of teams once we know how many kids are coming.</p>
        <div style={{display:"flex",gap:20,marginBottom:16}}>
          {[{label:"MINIMUM 👇",val:teamMin,set:setTeamMin,lo:2,hi:teamMax},{label:"MAXIMUM 👆",val:teamMax,set:setTeamMax,lo:teamMin,hi:20}].map(({label,val,set,lo,hi})=>(
            <div key={label} style={{flex:1}}>
              <label style={S.lbl}>{label}</label>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <button className="bh" style={S.btn("#FFE0EE","#FF6B9D",{padding:"7px 12px",fontSize:"1.2rem"})} onClick={()=>set(Math.max(lo,val-1))}>−</button>
                <span style={{fontFamily:"'Fredoka One',cursive",fontSize:"2rem",color:"#FF6B9D",minWidth:34,textAlign:"center"}}>{val}</span>
                <button className="bh" style={S.btn("#FFE0EE","#FF6B9D",{padding:"7px 12px",fontSize:"1.2rem"})} onClick={()=>set(Math.min(hi,val+1))}>+</button>
              </div>
            </div>
          ))}
        </div>
        <button className="bh" style={{...S.btn(),width:"100%"}} onClick={()=>setScreen("step2")}>Next →</button>
      </div>
    </div>
  );

  if (screen==="step2") return (
    <div style={S.wrap}><Progress/><SaveBar/>
      <div style={S.card} className="fade">
        <div style={{fontSize:"2rem",marginBottom:6}}>🤔</div>
        <h2 style={S.h2}>Party vibe?</h2>
        <label style={S.lbl}>HOW SHOULD WE MIX?</label>
        {[{id:"mix",emoji:"🌍",label:"Mix everyone up!",desc:"Different groups on each team — great for new friends"},
          {id:"keep",emoji:"💛",label:"Keep friends together",desc:"Kids stay near people they know"}].map(opt=>(
          <button key={opt.id} style={S.bigBtn(philosophy===opt.id)} onClick={()=>setPhilosophy(opt.id)}>
            <div style={{fontSize:"1.5rem",marginBottom:2}}>{opt.emoji}</div>
            <strong>{opt.label}</strong>
            <div style={{fontSize:"0.76rem",color:"#aaa",marginTop:2}}>{opt.desc}</div>
          </button>
        ))}
        <label style={{...S.lbl,marginTop:12}}>BALANCE BY GENDER?</label>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          {[{id:false,label:"No, not needed"},{id:true,label:"Yes please"}].map(opt=>(
            <button key={String(opt.id)} className="bh"
              style={S.btn(useGender===opt.id?"#FF6B9D":"#F0F0F0",useGender===opt.id?"white":"#666",{flex:1,fontSize:"0.85rem"})}
              onClick={()=>setUseGender(opt.id)}>{opt.label}</button>
          ))}
        </div>
        {philosophy!==null&&<button className="bh" style={{...S.btn(),width:"100%"}} onClick={()=>setScreen("step3")}>Next →</button>}
      </div>
    </div>
  );

  if (screen==="step3") return (
    <div style={S.wrap}><Progress/><SaveBar/>
      <div style={S.card} className="fade">
        <div style={{fontSize:"2rem",marginBottom:6}}>📋</div>
        <h2 style={S.h2}>Who's coming?</h2>
        <p style={S.sub}>Tap all the groups that apply — then we'll go through them one by one.</p>
        <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:14}}>
          {allCats.map(cat=>{
            const active=selectedCats.includes(cat.id);
            return <button key={cat.id} className="bh" style={S.btn(active?"#FF6B9D":"#F0F0F0",active?"white":"#555",{padding:"8px 14px",fontSize:"0.86rem"})} onClick={()=>toggleCat(cat.id)}>{cat.emoji} {cat.label}</button>;
          })}
        </div>
        <div style={{...S.row,marginBottom:12}}>
          <input style={{...S.inp,flex:1}} placeholder="+ Add custom group..." value={customCatInput}
            onChange={e=>setCustomCatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addCustomCat()}/>
          <button className="bh" style={S.btn("#FFE0EE","#FF6B9D",{whiteSpace:"nowrap"})} onClick={addCustomCat}>Add</button>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="bh" style={S.btn("#F0F0F0","#888",{padding:"11px 16px"})} onClick={()=>setScreen("step2")}>← Back</button>
          {selectedCats.length>0&&<button className="bh" style={{...S.btn(),flex:1}} onClick={()=>{setCatIndex(0);setScreen("step4");}}>Start adding kids →</button>}
        </div>
      </div>
    </div>
  );

  if (screen==="step4") {
    const cat = activeCats[catIndex]; if (!cat) return null;
    const kidsInCat = kids.filter(k=>k.category===cat.id);
    return (
      <div style={S.wrap}><Progress/><SaveBar/>
        <div style={S.card} className="fade">
          {/* Sticky top nav */}
          <div style={S.stickyNav}>
            <button className="bh" style={S.btn("#F0F0F0","#888",{padding:"9px 14px",fontSize:"0.82rem"})} onClick={prevCat}>← Back</button>
            <button className="bh" style={{...S.btn(),flex:1,textAlign:"center"}} onClick={nextCat}>
              {catIndex+1<activeCats.length?`Next (${catIndex+2}/${activeCats.length}) →`:"That's everyone! →"}
            </button>
          </div>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <span style={{fontSize:"0.76rem",color:"#ccc",fontWeight:800}}>GROUP {catIndex+1}/{activeCats.length}</span>
            <Counter/>
          </div>
          <div style={{fontSize:"1.7rem",marginBottom:3}}>{cat.emoji}</div>
          <h2 style={S.h2}>{cat.q}</h2>
          <p style={{...S.sub,marginBottom:10}}>Type a name + Enter, or paste a list. Tap ✏️ to edit.</p>

          {/* Edit modal */}
          {editingKid&&(
            <div style={{background:"#FFF0F7",borderRadius:16,padding:14,marginBottom:12,border:"2px solid #FFD6E7"}}>
              <label style={S.lbl}>✏️ EDITING: {editingKid.origName}</label>
              <input style={{...S.inp,marginBottom:7}} value={editingKid.name} onChange={e=>setEditingKid({...editingKid,name:e.target.value})}/>
              <label style={S.lbl}>AGE</label>
              <div style={{display:"flex",gap:5,marginBottom:7}}>
                {["younger","same","older"].map(a=>(
                  <button key={a} className="bh" style={S.btn(editingKid.age===a?"#FF6B9D":"#F0F0F0",editingKid.age===a?"white":"#666",{flex:1,fontSize:"0.76rem",padding:"6px 4px"})} onClick={()=>setEditingKid({...editingKid,age:a})}>{a}</button>
                ))}
              </div>
              {useGender&&<>
                <label style={S.lbl}>GENDER</label>
                <div style={{display:"flex",gap:5,marginBottom:7}}>
                  {["Boy","Girl","Other"].map(g=>(
                    <button key={g} className="bh" style={S.btn(editingKid.gender===g?"#FF6B9D":"#F0F0F0",editingKid.gender===g?"white":"#666",{flex:1,fontSize:"0.76rem"})} onClick={()=>setEditingKid({...editingKid,gender:g})}>{g}</button>
                  ))}
                </div>
              </>}
              <label style={S.lbl}>CATEGORY</label>
              <select style={{...S.inp,marginBottom:7}} value={editingKid.category}
                onChange={e=>{const c=allCats.find(x=>x.id===e.target.value);setEditingKid({...editingKid,category:c.id,categoryLabel:c.label});}}>
                {allCats.filter(c=>selectedCats.includes(c.id)).map(c=><option key={c.id} value={c.id}>{c.emoji} {c.label}</option>)}
              </select>
              <div style={{display:"flex",gap:7}}>
                <button className="bh" style={{...S.btn(),flex:1}} onClick={saveEdit}>Save ✓</button>
                <button className="bh" style={S.btn("#F0F0F0","#888",{flex:1})} onClick={()=>setEditingKid(null)}>Cancel</button>
              </div>
            </div>
          )}

          {/* Single name entry */}
          <div style={{...S.row,marginBottom:7}}>
            <input style={{...S.inp,flex:1}} placeholder="Type a name..." value={nameInput}
              onChange={e=>setNameInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addKid()} autoFocus/>
            <button className="bh" style={S.btn("#FF6B9D","white",{padding:"11px 14px"})} onClick={addKid}>Add</button>
          </div>

          {/* Age */}
          <div style={{marginBottom:7}}>
            <label style={S.lbl}>AGE vs OTHERS IN THIS GROUP</label>
            <div style={{display:"flex",gap:5}}>
              {[{id:"younger",label:"Younger"},{id:"same",label:"Same age"},{id:"older",label:"Older"}].map(a=>(
                <button key={a.id} className="bh" style={S.btn(ageFlag===a.id?"#FF6B9D":"#F0F0F0",ageFlag===a.id?"white":"#666",{flex:1,fontSize:"0.78rem",padding:"7px 4px"})} onClick={()=>setAgeFlag(a.id)}>{a.label}</button>
              ))}
            </div>
          </div>

          {/* Gender */}
          {useGender&&(
            <div style={{marginBottom:10}}>
              <label style={S.lbl}>GENDER</label>
              <div style={{display:"flex",gap:5}}>
                {["Boy","Girl","Other"].map(g=>(
                  <button key={g} className="bh" style={S.btn(genderFlag===g?"#7B68EE":"#F0F0F0",genderFlag===g?"white":"#666",{flex:1,fontSize:"0.78rem"})} onClick={()=>setGenderFlag(g)}>{g}</button>
                ))}
              </div>
            </div>
          )}

          {/* Paste toggle */}
          <button className="bh" style={S.btn(showPaste?"#FFE0EE":"#F5F5F5",showPaste?"#FF6B9D":"#888",{fontSize:"0.78rem",padding:"6px 13px",marginBottom:10})}
            onClick={()=>setShowPaste(p=>!p)}>📋 {showPaste?"Hide":"Paste a list of names"}</button>

          {showPaste&&(
            <div style={{background:"#FFF8FF",border:"2px solid #FFD6E7",borderRadius:14,padding:12,marginBottom:10}}>
              <label style={S.lbl}>PASTE — comma separated or one per line</label>
              <textarea style={{...S.inp,height:80,resize:"vertical",marginBottom:7}}
                placeholder={"Emma, Lily, Sophie\nor\nEmma\nLily\nSophie"}
                value={pasteInput} onChange={e=>{setPasteInput(e.target.value);setPastePreview([]);}}/>
              {!pastePreview.length?(
                <button className="bh" style={{...S.btn(),width:"100%"}} onClick={previewPaste}>Preview names →</button>
              ):(
                <>
                  <div style={{fontSize:"0.76rem",fontWeight:800,color:"#777",marginBottom:5}}>{pastePreview.length} names — tap × to remove any:</div>
                  <div style={{marginBottom:8}}>{pastePreview.map(n=>(
                    <span key={n} style={S.tag("#FFF0F7","#FF6B9D","#FFD6E7")}>
                      {n}<span style={{opacity:0.4,marginLeft:3}} onClick={()=>setPastePreview(p=>p.filter(x=>x!==n))}>×</span>
                    </span>
                  ))}</div>
                  <div style={{display:"flex",gap:7}}>
                    <button className="bh" style={S.btn("#F0F0F0","#888",{flex:1})} onClick={()=>setPastePreview([])}>← Edit</button>
                    <button className="bh" style={{...S.btn(),flex:1}} onClick={commitPaste}>Add {pastePreview.length} names →</button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Kids in this category */}
          <div style={{minHeight:32,marginBottom:4}}>
            {kidsInCat.map(k=>(
              <span key={k.name} style={S.tag("#FFF0F7","#FF6B9D","#FFD6E7")}>
                <span onClick={()=>setEditingKid({...k,origName:k.name})}>✏️ {k.name}{k.age!=="same"?` (${k.age})`:""}
                {useGender&&k.gender!=="?"?` · ${k.gender[0]}`:""}</span>
                <span style={{opacity:0.4,marginLeft:4}} onClick={()=>removeKid(k.name)}>×</span>
              </span>
            ))}
          </div>
        </div>

        {/* All guests summary */}
        {kids.length>0&&(
          <div style={{...S.card,background:"#FAFAFA"}}>
            <label style={S.lbl}>ALL GUESTS SO FAR</label>
            {activeCats.filter(c=>kids.some(k=>k.category===c.id)).map(c=>(
              <div key={c.id} style={{fontSize:"0.8rem",marginBottom:3}}>
                <span style={{fontWeight:800,color:"#bbb"}}>{c.emoji} {c.label}: </span>
                <span style={{color:"#666"}}>{kids.filter(k=>k.category===c.id).map(k=>k.name).join(", ")}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (screen==="step5") return (
    <div style={S.wrap}><Progress/><SaveBar/>
      <div style={S.card} className="fade">
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{fontSize:"2rem"}}>⭐</div><Counter/>
        </div>
        <h2 style={S.h2}>{mode==="parent"?`Who should be on ${birthdayName}'s team?`:`${birthdayName}, who do you want with you?`}</h2>
        <p style={S.sub}>Pick up to 2 friends — they'll definitely be on your team! ({picks.length}/2)</p>
        <div style={{display:"flex",flexWrap:"wrap",marginBottom:16}}>
          {kids.map(k=>(
            <span key={k.name} style={S.tag(picks.includes(k.name)?"#FF6B9D":"#FAFAFA",picks.includes(k.name)?"white":"#666",picks.includes(k.name)?"#FF6B9D":"#EEE")} onClick={()=>togglePick(k.name)}>
              {picks.includes(k.name)?"✓ ":""}{k.name}
            </span>
          ))}
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="bh" style={S.btn("#F0F0F0","#888",{padding:"11px 16px"})} onClick={()=>setScreen("step4")}>← Back</button>
          <button className="bh" style={{...S.btn(),flex:1}} onClick={goToOrphansOrTeamCount}>Next →</button>
        </div>
        <p style={{fontSize:"0.76rem",color:"#ccc",textAlign:"center",marginTop:6}}>skip picks and let us decide</p>
      </div>
    </div>
  );

  if (screen==="step6") {
    const allDecided = orphans.every(o=>orphanChoices[o.name]);
    return (
      <div style={S.wrap}><Progress/><SaveBar/>
        <div style={S.card} className="fade">
          <div style={{fontSize:"2rem",marginBottom:6}}>🤗</div>
          <h2 style={S.h2}>A couple of special guests!</h2>
          <p style={S.sub}>These kids don't share a group with anyone else:</p>
          {orphans.map(o=>(
            <div key={o.name} style={{background:"#FFF8F0",borderRadius:14,padding:14,marginBottom:10,border:"2px solid #FFE0CC"}}>
              <div style={{fontWeight:800,marginBottom:3}}>🧒 {o.name} <span style={{fontWeight:400,color:"#bbb",fontSize:"0.76rem"}}>({o.categoryLabel})</span></div>
              <div style={{display:"flex",gap:7}}>
                {[{id:"mixed",label:"Most mixed team 🌍"},{id:"manual",label:"We'll decide ✋"}].map(opt=>(
                  <button key={opt.id} className="bh"
                    style={S.btn(orphanChoices[o.name]===opt.id?"#FF6B9D":"#F0F0F0",orphanChoices[o.name]===opt.id?"white":"#666",{flex:1,fontSize:"0.83rem"})}
                    onClick={()=>setOrphanChoices(p=>({...p,[o.name]:opt.id}))}>{opt.label}</button>
                ))}
              </div>
            </div>
          ))}
          <div style={{display:"flex",gap:8,marginTop:6}}>
            <button className="bh" style={S.btn("#F0F0F0","#888",{padding:"11px 16px"})} onClick={()=>setScreen("step5")}>← Back</button>
            {allDecided&&<button className="bh" style={{...S.btn(),flex:1}} onClick={()=>setScreen("step7")}>Next →</button>}
          </div>
        </div>
      </div>
    );
  }

  if (screen==="step7") {
    const total = kids.length+1;
    const suggested = calcOptimalTeams(total,teamMin,teamMax);
    const current = numTeams||suggested;
    const validationError = validateTeamCount(current,total,teamMin,teamMax);
    return (
      <div style={S.wrap}><Progress/><SaveBar/>
        <div style={S.card} className="fade">
          <div style={{fontSize:"2rem",marginBottom:6}}>🔢</div>
          <h2 style={S.h2}>How many teams?</h2>
          <p style={S.sub}>With {total} guests and teams of {teamMin}–{teamMax}, we suggest <strong>{suggested} teams</strong>. You can adjust below.</p>
          <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12,justifyContent:"center"}}>
            <button className="bh" style={S.btn("#FFE0EE","#FF6B9D",{padding:"8px 16px",fontSize:"1.3rem"})} onClick={()=>setNumTeams(Math.max(2,current-1))}>−</button>
            <span style={{fontFamily:"'Fredoka One',cursive",fontSize:"2.5rem",color:"#FF6B9D"}}>{current}</span>
            <button className="bh" style={S.btn("#FFE0EE","#FF6B9D",{padding:"8px 16px",fontSize:"1.3rem"})} onClick={()=>setNumTeams(current+1)}>+</button>
          </div>
          {validationError?(
            <div style={{background:"#FFF0F0",border:"2px solid #FFD6D6",borderRadius:12,padding:12,marginBottom:12,fontSize:"0.83rem",color:"#EF476F",fontWeight:700}}>{validationError}</div>
          ):(
            <div style={{background:"#F0FFF4",border:"2px solid #C3E6CB",borderRadius:12,padding:10,marginBottom:12,fontSize:"0.83rem",color:"#2D6A4F"}}>
              ✓ {current} teams of ~{Math.round(total/current)} kids each — looks good!
            </div>
          )}
          <div style={{display:"flex",gap:8}}>
            <button className="bh" style={S.btn("#F0F0F0","#888",{padding:"11px 14px"})} onClick={()=>setScreen(orphans.length>0?"step6":"step5")}>← Back</button>
            {!validationError&&<button className="bh" style={{...S.btn(),flex:1}} onClick={()=>setScreen("step8")}>Next →</button>}
          </div>
        </div>
      </div>
    );
  }

  if (screen==="step8") {
    const n = numTeams||calcOptimalTeams(kids.length+1,teamMin,teamMax);
    return (
      <div style={S.wrap}><Progress/><SaveBar/>
        <div style={S.card} className="fade">
          <div style={{fontSize:"2rem",marginBottom:6}}>🏷️</div>
          <h2 style={S.h2}>What should the teams be called?</h2>
          <p style={S.sub}>Make up names yourselves, or let us suggest some fun ones!</p>
          <div style={{display:"flex",gap:8,marginBottom:18}}>
            <button className="bh" style={S.btn(namingMode==="self"?"#FF6B9D":"#F0F0F0",namingMode==="self"?"white":"#555",{flex:1,fontSize:"0.85rem"})} onClick={()=>{setNamingMode("self");if(teamNames.length<n)setTeamNames([...Array(n)].map((_,i)=>teamNames[i]||""));}}>✏️ We'll make them up</button>
            <button className="bh" style={S.btn(namingMode==="ai"?"#FF6B9D":"#F0F0F0",namingMode==="ai"?"white":"#555",{flex:1,fontSize:"0.85rem"})} onClick={()=>{setNamingMode("ai");generateTeamNames(n);}}>✨ Suggest some!</button>
          </div>

          {namingMode==="ai"&&namingLoading&&<p style={{textAlign:"center",color:"#bbb",marginBottom:12}}>Coming up with fun names... 🎨</p>}

          {namingMode&&!namingLoading&&(
            <>
              <label style={S.lbl}>TEAM NAMES — edit any of them</label>
              {[...Array(n)].map((_,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:7}}>
                  <div style={{width:12,height:12,borderRadius:"50%",background:COLORS[i%COLORS.length],flexShrink:0}}/>
                  <input style={{...S.inp,flex:1}} value={teamNames[i]||""}
                    placeholder={`Team ${i+1} name...`}
                    onChange={e=>{const n2=[...teamNames];n2[i]=e.target.value;setTeamNames(n2);}}/>
                </div>
              ))}
              {namingMode==="ai"&&<button className="bh" style={S.btn("#F5F5F5","#888",{fontSize:"0.8rem",marginBottom:12})} onClick={()=>generateTeamNames(n)}>🔄 Suggest different names</button>}
            </>
          )}

          <div style={{display:"flex",gap:8,marginTop:4}}>
            <button className="bh" style={S.btn("#F0F0F0","#888",{padding:"11px 14px"})} onClick={()=>setScreen("step7")}>← Back</button>
            {namingMode&&!namingLoading&&<button className="bh" style={{...S.btn(),flex:1}} onClick={buildTeams}>Make the Teams! 🎉</button>}
          </div>
        </div>
      </div>
    );
  }

  if (screen==="step9") {
    if (loading) return (
      <div style={S.wrap}>
        <div style={{...S.card,textAlign:"center",padding:"60px 24px"}}>
          <div style={{fontSize:"3rem",animation:"spin 1.2s linear infinite",display:"inline-block",marginBottom:12}}>🎂</div>
          <h2 style={{...S.h2,color:"#FF6B9D"}}>Making the perfect teams...</h2>
          <p style={{color:"#bbb"}}>Balancing, mixing, making everyone happy 🎊</p>
        </div>
      </div>
    );
    if (errorMsg) return (
      <div style={S.wrap}>
        <div style={S.card} className="fade">
          <div style={{fontSize:"2rem",marginBottom:6}}>😬</div>
          <h2 style={{...S.h2,color:"#EF476F"}}>Oops — something went wrong</h2>
          <p style={{color:"#888",marginBottom:8}}>{errorMsg}</p>
          <p style={{fontSize:"0.72rem",color:"#ccc",background:"#f9f9f9",padding:10,borderRadius:10,marginBottom:12,wordBreak:"break-all"}}>{debugInfo||"(no debug info)"}</p>
          <div style={{background:"#F0FFF4",border:"2px solid #C3E6CB",borderRadius:12,padding:12,marginBottom:14}}>
            <div style={{fontWeight:800,color:"#2D6A4F",marginBottom:3}}>✅ Your guest data is safe</div>
            <p style={{fontSize:"0.82rem",color:"#555",margin:0}}>All {kids.length} guests are saved. Just try again!</p>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="bh" style={{...S.btn(),flex:1}} onClick={buildTeams}>Try Again 🔄</button>
            <button className="bh" style={S.btn("#F0F0F0","#888",{flex:1})} onClick={()=>setScreen("step8")}>← Back</button>
          </div>
        </div>
      </div>
    );

    // Back warning modal
    if (showBackWarning) return (
      <div style={S.wrap}>
        <div style={{...S.card,textAlign:"center"}}>
          <div style={{fontSize:"2rem",marginBottom:8}}>⚠️</div>
          <h2 style={{...S.h2,color:"#FFB347"}}>Going back will clear the teams</h2>
          <p style={{color:"#888",marginBottom:16}}>You'll need to regenerate after making your changes. Your guest data will be kept.</p>
          <div style={{display:"flex",gap:8}}>
            <button className="bh" style={S.btn("#F0F0F0","#888",{flex:1})} onClick={()=>setShowBackWarning(false)}>Cancel</button>
            <button className="bh" style={{...S.btn("#FFB347"),flex:1}} onClick={confirmBack}>Yes, go back</button>
          </div>
        </div>
      </div>
    );

    return (
      <div style={S.wrap}>
        <SaveBar/>
        {/* Header */}
        <div style={{...S.card,background:"linear-gradient(135deg,#FF6B9D,#FF8E53)",textAlign:"center"}} className="fade">
          <div style={{fontSize:"2.5rem",marginBottom:4}}>🎉</div>
          <h1 style={{fontFamily:"'Fredoka One',cursive",fontSize:"2rem",color:"white",margin:"0 0 4px"}}>Teams are ready!</h1>
          <p style={{color:"rgba(255,255,255,0.85)",margin:0}}>{totalKids} guests · {teams.length} teams · {birthdayName}'s party</p>
          {generalNote&&<p style={{color:"rgba(255,255,255,0.75)",fontSize:"0.83rem",margin:"8px 0 0",fontStyle:"italic"}}>{generalNote}</p>}
        </div>

        {warnings.length>0&&(
          <div style={{...S.card,background:"#FFF8E7",border:"2px solid #FFD166"}}>
            {warnings.map((w,i)=><p key={i} style={{margin:0,color:"#B8860B",fontWeight:700,fontSize:"0.83rem"}}>{w}</p>)}
          </div>
        )}

        {teams.map((team,tIdx)=>(
          <div key={tIdx} style={{...S.card,borderLeft:`6px solid ${team.color}`}} className="fade">
            <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:8}}>
              <div style={{width:14,height:14,borderRadius:"50%",background:team.color,flexShrink:0}}/>
              <input style={{fontFamily:"'Fredoka One',cursive",fontSize:"1.15rem",color:team.color,border:"none",outline:"none",background:"transparent",flex:1,fontWeight:700}}
                value={team.name} onChange={e=>updateTeamName(tIdx,e.target.value)}/>
              <span style={{background:team.color+"20",color:team.color,borderRadius:20,padding:"2px 10px",fontSize:"0.76rem",fontWeight:800,flexShrink:0}}>{team.members.length} kids</span>
            </div>
            <div style={{display:"flex",flexWrap:"wrap",marginBottom:6}}>
              {team.members.map(m=>(
                <span key={m} style={{...S.tag(team.color+"18",team.color,team.color+"40"),cursor:swapKid===m?"default":"pointer"}}
                  onClick={()=>setSwapKid(swapKid===m?null:m)}>
                  {m===birthdayName?"⭐ ":""}{m}{swapKid===m?" ✓":""}
                </span>
              ))}
            </div>
            {swapKid&&teams[tIdx].members.includes(swapKid)&&(
              <div style={{marginTop:6}}>
                <div style={{fontSize:"0.76rem",fontWeight:800,color:"#aaa",marginBottom:5}}>MOVE {swapKid} TO:</div>
                <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                  {teams.map((t,i)=>i!==tIdx&&(
                    <button key={i} className="bh" style={S.btn(t.color+"20",t.color,{fontSize:"0.78rem",padding:"5px 10px",border:`2px solid ${t.color}40`})}
                      onClick={()=>moveKid(swapKid,tIdx,i)}>{t.name}</button>
                  ))}
                </div>
              </div>
            )}
            {team.description&&<p style={{fontSize:"0.8rem",color:"#bbb",margin:"4px 0 0",fontStyle:"italic"}}>{team.description}</p>}
          </div>
        ))}

        {/* Actions */}
        <div style={{...S.card,display:"flex",gap:7,flexWrap:"wrap"}} className="no-print">
          <button className="bh" style={{...S.btn(),flex:"1 1 80px"}} onClick={()=>window.print()}>🖨️ Print</button>
          <button className="bh" style={S.btn("#FFF0F7","#FF6B9D",{flex:"1 1 80px"})} onClick={()=>setScreen("step10")}>✏️ Edit</button>
          <button className="bh" style={S.btn("#F0F0F0","#888",{flex:"1 1 80px"})} onClick={buildTeams}>🔄 Reshuffle</button>
          <button className="bh" style={S.btn("#FFF0F0","#EF476F",{flex:"1 1 80px"})} onClick={()=>navTo("step4")}>← Fix inputs</button>
        </div>
      </div>
    );
  }

  if (screen==="step10") {
    if (showBackWarning) return (
      <div style={S.wrap}>
        <div style={{...S.card,textAlign:"center"}}>
          <div style={{fontSize:"2rem",marginBottom:8}}>⚠️</div>
          <h2 style={{...S.h2,color:"#FFB347"}}>Going back will clear the teams</h2>
          <p style={{color:"#888",marginBottom:16}}>You'll need to regenerate after making your changes. Guest data stays safe.</p>
          <div style={{display:"flex",gap:8}}>
            <button className="bh" style={S.btn("#F0F0F0","#888",{flex:1})} onClick={()=>setShowBackWarning(false)}>Cancel</button>
            <button className="bh" style={{...S.btn("#FFB347"),flex:1}} onClick={confirmBack}>Yes, go back</button>
          </div>
        </div>
      </div>
    );
    return (
      <div style={S.wrap}>
        <div style={S.card} className="fade">
          <div style={{fontSize:"2rem",marginBottom:6}}>✏️</div>
          <h2 style={S.h2}>Make Changes</h2>
          <p style={S.sub}>Remove kids, add late arrivals, swap between teams, or fix earlier inputs.</p>

          <div style={{marginBottom:18}}>
            <label style={S.lbl}>REMOVE A KID (CAN'T COME) 👋</label>
            {teams.flatMap(t=>t.members.map(m=>(
              <span key={m} style={S.tag("#FFF0F0","#EF476F","#FFD6D6")} onClick={()=>removeFromTeams(m)}>
                {m} <span style={{opacity:0.4,marginLeft:3}}>×</span>
              </span>
            )))}
          </div>

          <div style={{marginBottom:18}}>
            <label style={S.lbl}>ADD A LATE ARRIVAL 🏃</label>
            <input style={{...S.inp,marginBottom:7}} placeholder="Name..." value={newKidName} onChange={e=>setNewKidName(e.target.value)}/>
            <select style={{...S.inp,marginBottom:7}} value={newKidTeamIdx} onChange={e=>setNewKidTeamIdx(Number(e.target.value))}>
              {teams.map((t,i)=><option key={i} value={i}>{t.name}</option>)}
            </select>
            {newKidName.trim()&&<button className="bh" style={{...S.btn(),width:"100%"}} onClick={addToTeam}>Add to {teams[newKidTeamIdx]?.name} →</button>}
          </div>

          {warnings.length>0&&(
            <div style={{background:"#FFF8E7",border:"2px solid #FFD166",borderRadius:12,padding:10,marginBottom:14}}>
              {warnings.map((w,i)=><p key={i} style={{margin:0,color:"#B8860B",fontWeight:700,fontSize:"0.82rem"}}>{w}</p>)}
            </div>
          )}

          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <button className="bh" style={S.btn("#F0F0F0","#888",{flex:"1 1 100px"})} onClick={()=>setScreen("step9")}>← Back to Teams</button>
            <button className="bh" style={{...S.btn(),flex:"1 1 100px"}} onClick={buildTeams}>🔄 Reshuffle</button>
            <button className="bh" style={S.btn("#FFF0F0","#EF476F",{flex:"1 1 100px"})} onClick={()=>navTo("step4")}>Fix inputs</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
