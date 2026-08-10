function simpleHash(str){let hash=0;for(let i=0;i<str.length;i++){hash=(hash<<5)-hash+str.charCodeAt(i);hash|=0;}
return Math.abs(hash);}
function calculateLove(){const name1=(document.getElementById('name1').value||'').trim().toLowerCase();const name2=(document.getElementById('name2').value||'').trim().toLowerCase();if(!name1||!name2){document.getElementById('resultValue').textContent='—';return;}
const combined=simpleHash(name1+name2);const score=40+(combined%60);document.getElementById('resultValue').textContent=score+'%';}
document.addEventListener('DOMContentLoaded',()=>{document.getElementById('calcForm').addEventListener('input',calculateLove);calculateLove();});