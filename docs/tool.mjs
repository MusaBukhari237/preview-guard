const patterns=[
  ["Private key block",/-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----[\s\S]*?(?:-----END (?:[A-Z0-9]+ )*PRIVATE KEY-----|$)/g],
  ["Authorization value",/\b(?:Bearer|Basic)\s+[A-Za-z0-9._/+=-]{8,}/gi],
  ["Credential assignment",/\b(?:api[_-]?key|access[_-]?token|client[_-]?secret|password|passwd)\b["']?\s*[:=]\s*(?:"[^"\r\n]+"|'[^'\r\n]+'|[^\s,;}\]]{4,})/gi],
  ["Recognizable token",/\b(?:gh[pousr]_|github_pat_|sk-(?:proj-)?|AKIA)[A-Za-z0-9_-]{16,}\b/g],
  ["Connection or login URL",/\b(?:(?:postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis):\/\/[^\s"'<>]+|https?:\/\/[^\s"'/<>]+@[^\s"'<>]+)/gi],
  ["Local path",/(?:\b[A-Z]:\\(?:Users|Documents and Settings)\\[^'"\r\n<>]+|\/(?:home|Users)\/[^'"\s<>]+)/gi],
  ["Internal hostname",/\b(?:[A-Za-z\d][A-Za-z\d-]*\.)+(?:internal|intranet|local|corp)(?=$|[^A-Za-z\d-])/gi],
  ["Private IPv4 address",/\b(?:10\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])|192\.168)\.\d{1,3}\.\d{1,3}\b/g]
];
const mail=["Email address",/\b[A-Z\d._%+-]+@[A-Z\d.-]+\.[A-Z]{2,}\b/gi];
export function scan(text,{includeEmail=false,terms=[]}={}){
  if(!text.trim()||text.length>500000)throw Error("Paste between 1 and 500,000 characters.");
  if(terms.length>24||terms.some(term=>typeof term!=="string"||term.length<3||term.length>80))throw Error("Use up to 24 custom terms of 3–80 characters.");
  const known=terms.map(term=>["Custom term",new RegExp(term.replace(/[.*+?^$[\]{}()|\\]/g,"\\$&"),"gi")]);
  const matches=[];
  for(const [category,re] of [...patterns,...(includeEmail?[mail]:[]),...known]){
    for(const match of text.matchAll(re)){
      matches.push({category,start:match.index,end:match.index+match[0].length});
      if(matches.length>5000)throw Error("Too many matches. Split the artifact into smaller sections.");
    }
  }
  matches.sort((a,b)=>a.start-b.start||b.end-a.end);
  const spans=[];
  for(const match of matches){
    const prev=spans.at(-1);
    if(prev&&match.start<prev.end){prev.end=Math.max(prev.end,match.end);prev.categories.add(match.category);}
    else spans.push({start:match.start,end:match.end,categories:new Set([match.category])});
  }
  let at=0,line=1,redacted="";
  const findings=[];
  for(const span of spans){
    const segment=text.slice(at,span.start);
    line+=(segment.match(/\n/g)||[]).length;
    findings.push({line,categories:[...span.categories]});
    redacted+=segment+"[REDACTED]";
    const lineBreaks=(text.slice(span.start,span.end).match(/\n/g)||[]).length;
    redacted+="\n".repeat(lineBreaks);
    line+=lineBreaks;
    at=span.end;
  }
  return {findings,redacted:redacted+text.slice(at)};
}
