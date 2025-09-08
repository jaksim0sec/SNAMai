//잡다한 모듈 선언하기
const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
const PORT = 3000;

//환경정리
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


//정적파일 
app.use(express.static(path.join(__dirname, "..")));

//기본라우팅
app.get("/", (req, res) => {
res.sendFile(path.resolve(__dirname, "../front/index.html"));
});



// 기존 AI 응답 API
app.post('/ai', async (req, res) => {
  if (!req.body || !req.body.data || !((Object.hasOwn(req.body.data, 'context') &&
  Object.hasOwn(req.body.data, 'content') &&
  Object.hasOwn(req.body.data, 'before') &&
  Object.hasOwn(req.body.data, 'username'))) ) {
    return res.status(400).json({ r: "no_vpmt" });
  }
  const i = req.body.data;
  try {
    let vpmt = `
    너는 성남시에 특화된 **학생 진로 / 성인 취업 상담 AI**, "성남.ai" 임.

    규칙
    - 모든 응답은 **성남시와 관련된 정보**를 기반으로 함. 제공하는 정보는 **정확한 명칭**과 함께 제시함
    - 매 응답은 **이전 맥락 및 사용자의 입력(내용 key)**을 근본으로 작성할 것.
    - 오타나 축약 표현을 **유연하게 해석**하여 자연스럽게 응답.
    - 내용 초기에 인사를 절대 포함하지 않음.
    - (내용이 성남시에 관련됨 || 진로/취업/정책에 관련됨)? 친절히 대답 : (욕설 또는 비속어 포함)? 적극 제한 : 친절히 대답 거부
    - (현재 사용자 요청내용에 딱히 요구사항 없음 && 사용자의 학생/성인 여부 및 관심 분야 정보 없음)?사용자의 학생/성인여부 와 관심/종사분야 수집 : 대화 진행
    - **텍스트 강조 효과**를 적절히 활용할 것 (**볼드**, __밑줄__, --하이라이트--, #제목#). 가독성을 고려하여 적절하게 사용. 제목은 필수사용. ~~옆줄~~ 은 금지
    - 응답에 포함되는 **맥락 요약은 '이전맥락 + 현재 질문/응답'**을 통합한 최신 맥락으로 생성할 것. 주제가 변경되면 이전 대화 맥락은 최대요약하고, 사용자 정보만 유지.
    !! 맥락은 핵심적인 내용을 무조건 포함, 다만 성남시/필수내용과 관련없는 내용은 삭제.
    - 너무 깊이/많이 질문하지 말고, 적당선에서 사용자가 요구하는 것을 제시.
    - 답변은 이모티콘을 활용하며 항상 **상담사처럼 친절하고 따뜻하게**
    - 답변중 학교 명칭이 있으면 %학교% 와 같이 % 를 묶어 정확한 명칭을 보낼것. 이것은 필수적인 절차, 재차 확인할것. 
    !! 학교 명칭 주변에는 %를 제외하고 특수문자를 사용하는 것을 권장하지 않음
    !! 해당 학교에 관하여 구체적인 정보는 제시하지 말것.
    - 응답의 키워드(예:기업이름/구체적 지명)이 나오면 ~~ 로 묶음 (예시: ~~네이버~~)
    - 응답은 **간결하되 핵심 정보는 모두 포함**할 것.
    - 응답에 두가지 주제가 두가지 이상(예: 사용자의 질문 대답 & 사용자의 학생 여부 질문) 이를 또렷하게 분리하여 표기.
    
    결과는 반드시 {응답: (답변), 맥락: (현재 맥락)} 형식의 **정확한 JSON 객체**를 텍스트 형식으로 반환. 
    !!절대 다른 데이터나 형식을 포함하거나 변형하지 말 것. → 잘못된 JSON은 시스템 오류를 유발함. 
    !! keys 의 이름은 무조건 '응답' , '맥락'. values 는 문자열 형식. 줄바꿈 허용
    !! JSON 형식이 올바른지 다시확인. JSON 의 {} 외부에는 아무것도 없도록 주의

    처리할 데이터:
    {
      "사용자 요청": "${i.content}",
      "사용자 이름": "${i.username}",
      "이전 맥락": "${i.context}",
      "이전 메세지": "${i.before}"
    }
    `;

    const key = "AIzaSyB1yLx2PsPhNfA51HPBrCwb-gTnaAmQ5U4";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": key,
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: vpmt }] }],
      }),
    });

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    res.status(200).json({ r: resultText });
  } catch (er) {
    console.error(
      req.headers["x-forwarded-for"] || req.socket.remoteAddress,
      "error:",
      er
    );
    res.status(500).json({ r: "internal_error" });
  }
});

//서버 메트릭스 돈아까워서 만든거
const schoolData = {
  // 예시: "낙생고등학교": { ...학교정보객체 }
};

//학교정보 가져오는거
async function fetchSchoolInfo(schoolName) {
  const apiKey = 'b7bdc4632198429696aab2a82ce6087c'; //토큰임 ㅋㅋ
  const apiUrl = `https://open.neis.go.kr/hub/schoolInfo`;
  const params = new URLSearchParams({
    KEY: apiKey,
    Type: 'json',
    pIndex: 1,
    pSize: 10,
    SCHUL_NM: schoolName,
  });

  try {
    const response = await fetch(`${apiUrl}?${params.toString()}`);
    const data = await response.json();

    if (data.RESULT) {
      console.warn(`학교 정보 검색 실패: ${data.RESULT.MESSAGE}`);
      return null;
    }
    if (!data.schoolInfo || !data.schoolInfo[1] || !data.schoolInfo[1].row) {
      return null;
    }

    return data.schoolInfo[1].row[0];
  } catch (error) {
    console.error('학교 정보 API 요청 중 오류 발생:', error);
    return null;
  }
}

//학교조회하기
app.post('/school', async (req, res) => {
  if (!req.body || !Array.isArray(req.body.schools)) {
    return res.status(400).json({ r: "no_schools" });
  }
  const schools = req.body.schools;
  const result = {};

  for (const school of schools) {
    if (schoolData[school]) {
      result[school] = schoolData[school];
    } else {
      const info = await fetchSchoolInfo(school);
      if (info) {
        schoolData[school] = info;
        result[school] = info;
      } else {
        result[school] = null;
      }
    }
  }

  res.status(200).json({ r: result });
});

//외부CRON을 이용하여 서버 지속적으로 켜놓기
app.get("/a", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8">
      <title>빈 페이지</title>
    </head>
    <body>
    </body>
    </html>
  `);
});


//서버실행하기
app.listen(PORT, () => {
  console.log(`대한민국 서버 포트 ${PORT} 에서 실행중`);
});
