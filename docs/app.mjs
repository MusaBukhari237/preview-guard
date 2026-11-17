const el=id=>document.getElementById(id), output=()=>el("result");
let urls=[];
function show(message) {
  for(const url of urls) URL.revokeObjectURL(url);
  urls=[];
  output().replaceChildren();
  const summary=document.createElement("p");
  summary.className="result-summary";
  summary.setAttribute("aria-live","polite");
  summary.textContent=message;
  output().append(summary);
}
function run(callback) {
  el("run").onclick=async()=>{
    el("run").disabled=true;
    try{await callback();}catch(error){show(error.message);}
    finally{el("run").disabled=false;}
  };
}
function table(rows) {
  const wrap=document.createElement("div"), data=document.createElement("table"), head=data.createTHead(), body=data.createTBody();
  wrap.className="table-wrap";
  rows.forEach((row,index)=>{
    const tr=(index?body:head).insertRow();
    for(const value of row){
      const cell=document.createElement(index?"td":"th");
      cell.textContent=String(value??"—");
      if(!index)cell.scope="col";
      tr.append(cell);
    }
  });
  wrap.append(data); output().append(wrap);
}
function download(name,contents,type) {
  const url=URL.createObjectURL(new Blob([contents],{type}));
  urls.push(url);
  const anchor=document.createElement("a");
  anchor.className="button quiet export";
  anchor.textContent="Download "+name;
  anchor.download=name;
  anchor.href=url;
  output().append(anchor);
}
import {scan} from "./tool.mjs";
el("sample").onclick=()=>{
 el("source").value=["Package: Example Build","api_key="+"fixture123","Filesystem: /home/fixture/release","Service: jobs.sandbox.internal","Owner: someone@example.test","Status: ready"].join("\n");
 el("emails").checked=true;el("terms").value="";
};
run(()=>{
 const result=scan(el("source").value,{includeEmail:el("emails").checked,terms:el("terms").value.split(/\r?\n/).map(x=>x.trim()).filter(Boolean)});
 show(result.findings.length+" findings");
 if(result.findings.length)table([["Line","Category"],...result.findings.slice(0,100).map(x=>[x.line,x.categories.join(" · ")])]);
 const box=document.createElement("textarea");
 box.setAttribute("aria-label","Redacted preview");
 box.readOnly=true;box.rows=6;box.value=result.redacted;
 el("result").append(box);
 download("redacted-artifact.txt",result.redacted,"text/plain");
});
