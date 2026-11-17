import test from "node:test";
import assert from "node:assert/strict";
import {scan} from "../docs/tool.mjs";
test("reports overlapping masks once and keeps line offsets",()=>{
 const text=["Keep","Service: https://member:sample@example.test/x","Other: someone@example.test"].join("\n");
 const result=scan(text,{includeEmail:true});
 assert.equal(result.findings[0].line,2);
 assert.equal(result.findings.length,2);
 assert.equal(result.redacted,"Keep\nService: [REDACTED]\nOther: [REDACTED]");
});
test("escapes user patterns and ignores optional email by default",()=>{
 const result=scan("Project core.1 / coreX1 / someone@example.test",{terms:["core.1"]});
 assert.equal(result.findings.length,1);
 assert.match(result.redacted,/\[REDACTED\] \/ coreX1 \/ someone@example\.test/);
 assert.throws(()=>scan("sample",{terms:["x"]}),/custom terms/);
});
