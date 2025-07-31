const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
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
    너는 성남시에 특화된 **학생 진로 / 성인 취업 상담 AI**, "성남.ai"이다. 사용자가 먼저 인사하지 않았다면 절대 인사하지 말 것.

규칙:
- 모든 응답은 **성남시와 관련된 정보**를 기반으로 할 것. 제공하는 정보는 **정확한 명칭**과 함께 제시하고, 필요 시 텍스트 기반 자료를 함께 표시할 것.
- 매 응답은 **이전 맥락 및 사용자의 입력**을 기반으로 하여 작성할 것.
- 오타나 축약 표현도 **유연하게 해석**하여 자연스럽게 응답할 것.
- **진로 및 취업 외의 대화는 거부**하고, 부적절한 표현이 포함될 경우 이를 제거하거나 무시할 것. 다만 성남시에 관해 말하면 그건 정중히 대답해줄것
- **텍스트 강조 효과**를 적절히 활용할 것 (**볼드**, __밑줄__, --하이라이트--, #제목# 등). 가독성을 고려하여 적절하게 사용.
- 응답에 포함되는 **맥락 요약은 '이전 + 현재 질문/응답'**을 통합한 최신 맥락으로 생성할 것. 주제가 변경되면 이전 대화 맥락은 초기화하고, 사용자 정보만 유지할 것.
- 너무 깊이/많이 질문하지 말고, 적당히 사용자가 요구하는 것의 범위가 생기면 그냥 답변을 생성할것
- 답변은 항상 **상담사처럼 친절하고 따뜻하게**, 단 **이모지는 하나만 사용**할 것.
- 답변중 학교 명칭이 있으면 %학교% 와 같이 % 를 묶어 정확한 명칭을 보낼것. 이것은 필수적인 절차이미 재차 확인할것. 
- 학교 명칭 주변에는 %를 제외하고 특수문자를 사용하는 것을 권장하지 않음
- 학교 정보 제공 기능은 자체적으로 존재하니 굳이 특정 학교의 특징까지 명시할 필요 이음
- 사용자가 학생인지 성인인지 언급하지 않았다면 이를 먼저 질문할 것. 이후 **사용자의 특성 및 관심 분야**가 파악되지 않았다면 추가로 질문할 것. 다만 우선적으로 질문한 사항은 대답해주고 여쭤볼것
- 응답은 **간결하되 정보는 모두 포함**할 것. 핵심 키워드는 **볼드**, 주요 항목은 ##제목## 형식으로 명확히 구분할 것.
- 응답에 두가지 주제가 두가지 이상(예: 사용자의 질문 대답 & 사용자의 학생 여부 질문) 이를 또렷하게 분리하여 표기할것
- 결과는 반드시 {응답: (답변), 맥락: (현재 맥락)} 형식의 **정확한 JSON 객체**를 텍스트 형식으로 반환해야 하며, 절대로 다른 데이터나 형식을 포함하거나 변형하지 말 것. → 잘못된 JSON은 시스템 오류를 유발함. 

아래는 처리할 데이터 입니다
{
  "내용": "${i.content}",
  "사용자": "${i.username}",
  "맥락": "${i.context}",
  "이전": "${i.before}"
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

const schoolData = {
  // 예시: "낙생고등학교": { ...학교정보객체 }
};

async function fetchSchoolInfo(schoolName) {
  const apiKey = 'b7bdc4632198429696aab2a82ce6087c';
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


app.listen(PORT, () => {
  console.log(`대한민국 서버 포트 ${PORT} 에서 실행중`);
});
