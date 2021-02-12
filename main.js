async function getInitData(apiUrl, method, data) {
  const response = await callAPI(apiUrl, method, data);
  if (response.ok) {
    showContent();
    const data = await response.json();
    return data;
  } else if (response.status === 403) {
    window.location.href = "/view/login/page-signin";
    throw Error("you are not logined");
  } else {
    throw Error("HttpStatus is " + response.status);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  loadJS(
    "https://cdn.jsdelivr.net/npm/vue/dist/vue.js",
    "/resources/libraries/api.js"
  ).then(async function () {
    let json = await getInitData(apiUrl + "/api/port", "GET");
    await portContent(json);
  });
});

/**
 * 포트목록 생성 객체
 * @param datas 포트목록 data
 */
let portlistTable = function (datas) {
  let htmls = "";
  if (datas === undefined) {
    alert("목록초기화 에러");
    return;
  }
  datas.port.forEach((item, index) => {
    htmls +=
      "<tr>" +
      "<td class='departureIp'>" +
      item.departureIp +
      "</td>" +
      "<td class='arrivalIp'>" +
      item.arrivalIp +
      "</td>" +
      "<td class='arrivalPort'>" +
      item.arrivalPort +
      "</td>" +
      "<td class='needed'>" +
      (item.needed === 1 ? "Y" : "N") +
      "</td>";
    htmls +=
      "<td>" +
      '<div class="' +
      item.state +
      '">' +
      item.state +
      "</div>" +
      "</td>" +
      "<td>";
    if (item.state != "open" && item.state != "refuse") {
      htmls +=
        '<div class="material">' +
        '<div class="material-tool">' +
        '<a href="javascript:;" class="edit" data-clk="svc.edit">' +
        '<i class="fas fa-hammer"></i>' +
        "</a>" +
        "</div>" +
        '<div class="material-tool">' +
        '<a href="javascript:;" class="remove" data-clk="svc.trash">' +
        '<i class="far fa-trash-alt"></i>' +
        "</a>" +
        "</div>" +
        "</div>";
    }
    htmls += "</td>" + "</tr>";
  });
  document.querySelector("#portlist > tbody").innerHTML = htmls;
};
/**
 * 포트목록 search 객체
 */
let searchPortList = async function () {
  let param = {
    departureIp: document.querySelector("#dip").value,
    arrivalIp: document.querySelector("#aip").value,
    arrivalPort: document.querySelector("#port").value,
    state: [],
  };
  //체크박스 순회
  let state = document.querySelectorAll("input[type=checkbox]:checked");
  for (let i = 0; i < state.length; i++) {
    param.state.push(state[i].value);
  }

  // 검색결과
  let json = await getAPI(apiUrl + "/api/port/search", "POST", param);
  return json;
};
/**
 * 삭제이벤트
 * @param {Element} target 대상 tr element
 */
let removePortList = async function (target) {
  let param = {
    departureIp: target.querySelector("td.departureIp").innerText,
    arrivalIp: target.querySelector("td.arrivalIp").innerText,
    arrivalPort: target.querySelector("td.arrivalPort").innerText,
  };
  await getAPI(apiUrl + "/api/port/delete", "DELETE", param)
    .then(function (res) {
      if (res.error != undefined) {
        alertError(res);
      } else if (res.port[0].count > 0) {
        alert("Delete complete");
      }
    })
    .then(async function () {
      let json = await getAPI(apiUrl + "/api/port", "GET");
      await portContent(json);
    });
};

/**
 * 메인화면 초기화 및 이벤트 등록 함수
 * @param data 초기데이터 json
 */
function portContent(data) {
  portlistTable(data);
  updateModal.init();

  // 포트추가 화면 이동
  document.querySelector(".fas.fa-edit").addEventListener("click", function () {
    window.open("/view/port/add", "", "포트추가");
  });

  // 포트목록 검색
  document
    .querySelector(".fas.fa-search")
    .addEventListener("click", function () {
      searchPortList().then((result) => {
        portlistTable(result);
      });
    });

  // 포트목록 삭제
  let deleteEvent = document.querySelectorAll(".far.fa-trash-alt");
  let isConfirm = undefined;
  for (let i = 0; i < deleteEvent.length; i++) {
    deleteEvent[i].addEventListener("click", function (event) {
      isConfirm = confirm("DELETE?");
      if (isConfirm) {
        removePortList(event.target.closest("tr"));
      }
    });
  }
  document.querySelector("#excel").addEventListener("click", function (event) {
    searchPortList().then((result) => {
      excelHandler.init(result.port);
      exportExcel();
    });
  });
}
