
let EfetchWaiter = true
let EfetchTimeWaiter = true;
let username = '사용자'
let context = '아직 맥락없음'
let before = 'ai가 사용자에게 최초로, 인사 및 자기소개를 완료하고 열심히 답변하겠다함'
//유틸리티
const $ = (n) => document.querySelector(n);
async function typeText(name, content, speed=30) {
      const element = $(name);
      if (!element) {
        console.error(`${name}을 찾을 수 없습니다.`);
        return;
      }
      const scroll = setInterval(()=>{scrollTo()},500)
      let processedContent = '';
      let index = 0;

      while (index < content.length) {
        const char = content[index];

        if (char === '<') {
          processedContent += char;
          index++;
          while (content[index] !== '>' && index < content.length) {
            processedContent += content[index];
            index++;
          }
          processedContent += '>';
        } else {
          processedContent += char;
        }

        element.innerHTML = processedContent + '●'; 
        if (content[index] !== ' ') {
          await new Promise((resolve) => setTimeout(resolve, speed));
        }

        index++;
      }
      element.innerHTML = processedContent;
      return  clearInterval(scroll)
    }


async function Efetch(path, headers = {}, body = null, print = (typeof test !== 'undefined'?test:false), delay = 100) {
await wait(()=>EfetchWaiter)
if (!EfetchTimeWaiter) return clearInverval(scroll);
EfetchWaiter = false;
EfetchTimeWaiter = false;

try {
  const isPost = !!body;

  if (isPost && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch('/' + path, {
    method: isPost ? 'POST' : 'GET',
    headers,
    body: isPost ? JSON.stringify(body) : null,
  });
  if(res.status === 429)return alarm('워워, 조금 천천히 해주세요')

  const data = await res.json();
  if (print) console.log(`/${path} res:`, data);
  return data;

} catch (error) {
  console.error(`/${path} res ERROR:`, error);
  return null;
} finally {
  setTimeout(() => {
    EfetchTimeWaiter = true;
    EfetchWaiter = true;
  }, delay);
}
}

function wait(b) {
return new Promise((resolve) => {
  const check = () => {
    if (b()) return resolve();
    setTimeout(check, 30);
  };
  check();
});
}

function scrollTo(){
  document.querySelector('main').scrollTo({
top: document.querySelector('main').scrollHeight,
behavior: 'smooth'
});
}

function random(min, max) {
  const time = Date.now();
  let seed = time ^ (time >> 3);
  seed = (seed * 9301 + 49297) % 233280;
  const randomValue = seed / 233280 + Math.random();
  return Math.floor((randomValue % 1) * (max - min + 1)) + min;
}

function textEF(content) {
  return content
    .replace(/@[^@\s]{1,30}(?=\s|$)/g, m => `<span class='mention'>${m}</span>`)
    .replace(/(https?:\/\/[^\s]+|www\.[^\s]+)/g, m => 
      m.includes("i.ibb") ? m :
      `<span><a href="${m}" ${m.includes(location.origin)?'':`target="_blank"`} class="link">${m}</a></span>`
    )
    .replace(/__(.+?)__/gs, (_, p1) => `<span style='text-decoration: underline;'>${p1}</span>`)
    .replace(/\*\*([\s\S]*?)\*\*/g, (_, p1) => `<span style='font-weight:940;'>${p1}</span>`)
    .replace(/~~([\s\S]*?)~~/g, (_, p1) => `<span style='text-decoration: line-through;'>${p1}</span>`)
    .replace(/--([\s\S]*?)--/g, (_, p1) => `<span style='background-color:rgba(255,219,101,0.69);border-radius:5px;padding:2px;color:black;'>${p1}</span>`)
    .replace(/#([\s\S]*?)#/g, (_, p1) => `<span style="font-size:1.3em;">${p1}</span>`)
    .replaceAll("$br$", "<br>")
    .replaceAll("$sp$", "");
}


let aiLimit = true;
async function fetchAI(input, log) {
  if (!aiLimit) return "timeLimit";
  aiLimit = false;
  let r = await Efetch('ai',undefined,{data:{content:input,context:context,before:before,username:username}},false)
  aiLimit = true
  return r;
}

function makeChat(content, who='ai', animate=true) {
  const chat = document.createElement('section');
  const id = 'chat-' + Date.now().toString(36);
  const prof = `<span><img src="${who=='ai'?'https://ifh.cc/g/LQ0VPG.png':'https://ifh.cc/g/cdXtco.png'}" style="display:block;"/></span>`;
  const bubble = `<div class="bubble" style="border-radius:${who==='ai'?'2px 20px 20px 20px':'20px 2px 20px 20px;margin-left:auto;'}">${textEF(content)}</div>`;
  chat.innerHTML = who==='ai' ? `${prof}${bubble}` : `${bubble}${prof}`;
  chat.className = who;
  chat.id = id;
  if (animate) chat.style.animation = `showChat${who==='ai'?'L':'R'} 1s ease`;
  $('main').appendChild(chat);
  scrollTo()
  return id;
}

//modal Alarm
function bigAlarm(content, buttons = ['확인', '취소'], callback = () => {}) {
const id = Date.now().toString(36);
if (typeof content !== 'object') content = ['', content];

const close = () => {
  const modal = document.getElementById(`al${id}`);
  if (!modal) return;
  const buttons = modal.querySelectorAll('button');
  buttons.forEach(btn => btn.style.pointerEvents = 'none');
  modal.style.opacity = '0';
  setTimeout(() => modal.remove(), 500);
};

const modal = document.createElement('div');
modal.className = 'bigAlarm';
modal.id = `al${id}`;
modal.innerHTML = `
  <div>
    ${content[0] ? `<div class="title">${textEF(content[0])}</div>` : ''}
    <div${!content[0] ? ' style="font-size:1rem;opacity:1"' : ''}>${textEF(content[1])}</div>
    <article>
      <button class="highB" id="okBtn${id}">${textEF(buttons[0])}</button>
      <button id="cancelBtn${id}">${textEF(buttons[1])}</button>
    </article>
  </div>`;

modal.onclick = (e) => {
  if (e.target === modal) document.getElementById(`cancelBtn${id}`).click();
};
modal.querySelector('div').onclick = (e) => e.stopPropagation();

document.body.appendChild(modal);

document.getElementById(`okBtn${id}`).onclick = () => {
  close();
  callback();
};
document.getElementById(`cancelBtn${id}`).onclick = close;
}


const Storage = {
  setSession: (key, val) => sessionStorage.setItem(key, val),
  getSession: (key) => sessionStorage.getItem(key),
  setLocal: (key, val) => localStorage.setItem(key, val),
  getLocal: (key) => localStorage.getItem(key)
};

//input
let schools = {};

function initTextarea() {
  const ta = $('aside textarea');
  const phList = [
    '진로에 대해 궁금한 점을 입력해 주세요',
    '성남에 적절한 직업, 진로를 물어봐요',
    '어떤 진로가 맞을지 고민되시나요?',
    '성남의 취업정보를 알아봐요'
  ];
  ta.placeholder = phList[random(0,2)];

  ta.addEventListener('input', () => {
    ta.style.height = '30px';
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
  });

  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) e.preventDefault();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') $('div button').click();
  });

  $('div button').onclick = async () => {//채팅발생
    
    let input = ta.value.trim();
    if (!input) return;
    makeChat(input, 'me');
    let chat = makeChat('<span class="loading"></span><span> 응답 생성중 ...</span>');
    ta.value = '';
    ta.style.height = '30px';

    let res = await fetchAI(input);
    res = res && res.r;
    if (!res) {
      $(`#${chat} .bubble`).innerHTML = '죄송합니다. 응답을 받지 못했습니다.';
      return;
    }

    let parsed;
    try {
      // ```json``` 등 마크다운 백틱 제거 후 파싱 시도
      const cleanRes = res.replace(/```json\s*|```/g, '').trim();
      parsed = JSON.parse(cleanRes);
    } catch (e) {
      parsed = { 응답: res, 맥락: context };
    }

    before = input;
    context = parsed.맥락 || context;
    let answer = parsed.응답 || res;
    answer = textEF(answer)

    const schoolNameRegex = /[^\s~`!@#$%^&*()\-_=+\[\]{}\\|;:'",.<>/?]{2,}(고등학교|중학교|초등학교|대학교|대학)/g;


const matchedSchools = Array.from(new Set(
  (answer.match(schoolNameRegex) || []).map(s => s.trim())
));

console.log('학교명:', matchedSchools);

if (matchedSchools.length > 0) {
  HTML(`#${chat} .bubble`).innerHTML = '<span class="loading"></span><span> 추가정보 조회중 ...</span>';
  try {
    const schoolRes = await Efetch('school', {}, { schools: matchedSchools }, false);

    if (schoolRes && schoolRes.r) {
      matchedSchools.forEach(school => {
  if (school !== '과학고등학교') {
    console.log(schools,schoolRes.r,school)
    schools[school] = schoolRes.r[school];
    const replaced = `<span style="color:blue;font-weight:bold" onclick="ss('${school}')" class = "schoolShow">${school}</span>`;
    answer = answer.replaceAll(`%${school}%`, replaced);
  }
});

    }
  } catch (e) {
    console.error('학교정보 조회 오류:', e);
  }

// 이제 answer 를 한 번만 렌더링
if(answer.includes('schoolShow')) answer += `$br$$br$학교 이름을 클릭하시면 더 정확한 정보를 제공해드릴께요!`
$(`#${chat} .bubble`).innerHTML = '';
await typeText(`#${chat} .bubble`, answer.replaceAll('%','').replaceAll('\\n','<br>').replaceAll('\n','<br>'));
scrollTo();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initTextarea();
});

function useSchoolInfo(obj){
let orgObj = obj
obj = schools[obj.replaceAll('$sp$','')]
if (obj == null) return orgObj
let r = '';
r+=`#${insertSpAt(obj.SCHUL_NM)}#$br$$br$`;
r+=`**소속 교육청 : ** ${obj.ATPT_OFCDC_SC_NM||'정보없음'}$br$`;
r+=`**공학 여부 : ** ${obj.COEDU_SC_NM||'정보없음'}$br$`;
r+=`**학교 유형 : ** ${obj.FOND_SC_NM||'정보없음'}$br$`;
r+=`**학교 종류 : ** ${obj.HS_SC_NM||'정보없음'}$br$$br$`;
r+=`**문의 전화 : ** ${obj.ORG_TELNO||'정보없음'}$br$`;
r+=`**홈페이지 : ** ${obj.HMPG_ADRES||'정보없음'}$br$`;
return r;
}

function insertSpAt(str) {
  const pos = Math.floor(Math.random() * (str.length));
  return str.slice(0, pos) + '$sp$' + str.slice(pos);
}

function ss(s){
  makeChat(`더욱 정확한 학교 정보를 알아봤어요 : $br$ ${useSchoolInfo(s)}`)
}