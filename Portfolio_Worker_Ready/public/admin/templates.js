(()=>{
'use strict';
// Document layouts mirror the owner's supplied Word résumé and cover-letter examples.
// This exporter builds a standards-based editable DOCX in the browser; no document data leaves the tab.
const TE=new TextEncoder();
const x=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;');
const contact='0416 130 046 | saivikasmalladi@gmail.com | linkedin.com/in/saivikasmalladi';
const headings=new Set(['SKILLS','EDUCATION & QUALIFICATIONS','WORK EXPERIENCE','PROJECTS','VOLUNTEER & COMMUNITY INVOLVEMENT','REFERENCES']);
const subheadings=new Set(['DATA MANAGEMENT','TECHNICAL PROFICIENCY','STAKEHOLDER AND COMMUNICATION SKILLS']);
const normalize=s=>String(s||'').replace(/\r/g,'').split('\n').map(v=>v.trim()).filter(Boolean);
const paragraph=(value,kind='body')=>{
 const props=kind==='name'?'<w:jc w:val="center"/><w:spacing w:after="55"/>':kind==='contact'?'<w:jc w:val="center"/><w:spacing w:after="155"/>':kind==='section'?'<w:spacing w:before="200" w:after="95"/><w:keepNext/>':kind==='job'?'<w:spacing w:before="110" w:after="50"/><w:keepNext/>':kind==='bullet'?'<w:ind w:left="360" w:hanging="175"/><w:spacing w:after="45"/>':kind==='date'?'<w:jc w:val="right"/><w:spacing w:after="135"/>':kind==='recipient'?'<w:spacing w:after="190"/>':kind==='closing'?'<w:spacing w:before="125" w:after="160"/>':'<w:spacing w:after="95"/>';
 const text=kind==='bullet'?value.replace(/^[•●▪\-–*]\s*/,''):value;
 const formatting=kind==='name'?'<w:b/><w:sz w:val="23"/>':kind==='section'?'<w:b/><w:sz w:val="12"/>':kind==='job'?'<w:b/>':kind==='closing'?'<w:b/>':'';
 const align=kind==='body'||kind==='bullet'?'<w:jc w:val="both"/>':'';
 const runs=(kind==='bullet'?'<w:r><w:t xml:space="preserve">•  </w:t></w:r>':'')+'<w:r><w:rPr>'+formatting+'</w:rPr><w:t xml:space="preserve">'+x(text)+'</w:t></w:r>';
 return '<w:p><w:pPr>'+props+align+'</w:pPr>'+runs+'</w:p>';
};
const xml=(type,text,meta={})=>{
 const lines=normalize(text);
 const name=meta.name||'Sai Vikas Malladi';
 const body=[];
 body.push(paragraph(name,'name'),paragraph(meta.contact||contact,'contact'));
 if(type==='resume'){
  // Source template: centered name/contact, summary, skills (category bullets), education,
  // work experience, projects, community involvement, references.
  let section='',hasHeader=false;
  for(let line of lines){
   if(line.toLowerCase()===name.toLowerCase()||line.includes('saivikasmalladi@gmail.com')||/linkedin\.com\/in\/saivikasmalladi/i.test(line))continue;
   const upper=line.toUpperCase().replace(/:$/,'');
   if(headings.has(upper)){section=upper;hasHeader=true;body.push(paragraph(upper,'section'));continue}
   if(subheadings.has(upper)){body.push(paragraph(line,'job'));continue}
   if(/^[•●▪\-–*]\s+/.test(line)){body.push(paragraph(line,'bullet'));continue}
   if(/^(?:professional summary|profile|summary)\s*:?\s*$/i.test(line))continue;
   if(/^(?:master of|bachelor of|professional year|database administrator|public administration|it support consultant|store manager|student records analysis|supermarket sales)/i.test(line)&&section){body.push(paragraph(line,'job'));continue}
   if(!hasHeader&&/^(?:experience|skills|education|projects)$/i.test(line))continue;
   body.push(paragraph(line,'body'));
  }
 }else{
  const today=new Date().toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'});
  body.push(paragraph(meta.date||today,'date'));
  let hasGreeting=false;
  for(let line of lines){
   if(line.toLowerCase()===name.toLowerCase()||line.includes('saivikasmalladi@gmail.com')||/linkedin\.com\/in\/saivikasmalladi/i.test(line))continue;
   if(/^\d{1,2}(?:st|nd|rd|th)?\s+[a-z]+\s+\d{4}$/i.test(line))continue;
   if(/^Dear\b/i.test(line))hasGreeting=true;
   if(/^(?:yours sincerely|kind regards|sincerely|yours faithfully),?$/i.test(line)){body.push(paragraph(line,'closing'));continue}
   if(/^(Hiring Manager|Recruitment Team|To the Hiring Manager|[A-Z][\w &.-]+,\s*(?:SA|NSW|QLD|VIC|WA|TAS))$/i.test(line))body.push(paragraph(line,'recipient'));
   else body.push(paragraph(line,'body'));
  }
  if(!hasGreeting)body.splice(3,0,paragraph('Dear Hiring Manager,','body'));
 }
 const margins=type==='resume'?{top:995,bottom:1134,left:1134,right:1134}:{top:1440,bottom:1440,left:1440,right:1440};
 return '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'+
 '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+
 body.join('')+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="'+margins.top+'" w:right="'+margins.right+'" w:bottom="'+margins.bottom+'" w:left="'+margins.left+'" w:header="708" w:footer="708" w:gutter="0"/></w:sectPr></w:body></w:document>';
};
function crc(bytes){let v=-1;for(const b of bytes){v^=b;for(let i=0;i<8;i++)v=(v>>>1)^((v&1)?0xedb88320:0)}return (v^-1)>>>0}
function zip(files){
 const parts=[],directory=[];let offset=0;
 const u16=(v)=>[v&255,(v>>>8)&255],u32=(v)=>[v&255,(v>>>8)&255,(v>>>16)&255,(v>>>24)&255];
 for(const [path,body] of files){
  const name=TE.encode(path),data=TE.encode(body),sum=crc(data);
  const local=Uint8Array.from([...u32(0x04034b50),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(sum),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...name]);
  parts.push(local,data);
  const central=Uint8Array.from([...u32(0x02014b50),...u16(20),...u16(20),...u16(0),...u16(0),...u16(0),...u16(0),...u32(sum),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset),...name]);
  directory.push(central);offset+=local.length+data.length;
 }
 const size=directory.reduce((sum,p)=>sum+p.length,0),end=Uint8Array.from([...u32(0x06054b50),...u16(0),...u16(0),...u16(files.length),...u16(files.length),...u32(size),...u32(offset),...u16(0)]);
 return new Blob([...parts,...directory,end],{type:'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
}
function download(type,text,meta={}){
 if(!String(text||'').trim())throw Error('Generate or enter document text before downloading.');
 const base='<?xml version="1.0" encoding="UTF-8"?>';
 const entries=[
 ['[Content_Types].xml',base+'<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>'],
 ['_rels/.rels',base+'<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'],
 ['word/document.xml',xml(type,text,meta)]
 ];
 const blob=zip(entries),link=document.createElement('a'),url=URL.createObjectURL(blob);
 link.href=url;link.download='Sai_Vikas_'+(type==='resume'?'Tailored_Resume':'Cover_Letter')+'.docx';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
}
window.CareerStudioTemplates={download,xml};
})();
