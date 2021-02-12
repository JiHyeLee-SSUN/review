document.addEventListener("DOMContentLoaded", function () {
  loadJS(
    "https://cdn.jsdelivr.net/npm/vue/dist/vue.js",
    "/resources/libraries/api.js"
  ).then(function () {
    document.getElementsByClassName("loading-container")[0].style.display =
      "none";
    document.getElementsByClassName("mainContent")[0].style.display = "block";
    addPortEvent.init();
  });
});

/**
 * 전송 Object 틀
 * @type Object
 * @property {string} departureIp 출발 IP
 * @property {string} arrivalIp 도착 IP
 * @property {string} arrivalPort 도착 PORT
 * @property {Chart} needed 필수여부 (Y/N)
 */
const paramObject = {
  departureIp: "",
  arrivalIp: "",
  arrivalPort: "",
  needed: "",
};

/**
 * db Insert 함수
 * port 자원을 DB에 insert
 */
let sendPortList = function () {
  let param = new Array();
  let targetElement = document.querySelectorAll(
    "#portAddList tbody tr.validate"
  );
  for (let i = 0; i < targetElement.length; i++) {
    let port = JSON.parse(JSON.stringify(paramObject));
    port.departureIp = targetElement[i].querySelector(".departure").value;
    port.arrivalIp = targetElement[i].querySelector(".arrival").value;
    port.arrivalPort = targetElement[i].querySelector(".port").value;
    port.description = targetElement[i].querySelector(".description").value;
    port.needed = targetElement[i].querySelector(".needed").checked ? "1" : "0";

    param.push(port);
  }

  getAPI(apiUrl + "/api/port/add", "POST", param).then(function (res) {
    if (res.error != undefined) {
      alertError(res);
    } else if (res.port[0].count === param.length) {
      if (confirm("삽입성공. 삽입한 사항에 대해 엑셀파일을 다운받겠습니까?")) {
        excelHandler.init(param);
        exportExcel();
      }
      location.reload();
    }
  });
};

/**
 * 이벤트리스너 모음 함수
 */
let addPortEvent = {
  init: () => {
    /**
     * 노드 추가 이벤트
     * 포트정보 입력란을 생성한다
     */
    document.getElementById("add").addEventListener("click", function () {
      addNode("#portAddList tbody");
    });

    /**
     * 포트신청 이벤트
     * 검증된 포트정보들을 DB로 전송한다
     */
    document.getElementById("send").addEventListener("click", function () {
      let validateItem = document.querySelectorAll("#portAddList tbody tr");
      let checkValidate = true;

      if (validateItem.length === 0) {
        return;
      }
      for (let i = 0; i < validateItem.length; i++) {
        if (!validateItem[i].classList.contains("validate")) {
          alert(i + 1 + "번째 목록이 검증되지 않았습니다.");
          checkValidate = false;
          break;
        }
      }
      if (!checkValidate) {
        return;
      }
      sendPortList();
    });
  },
  /**
   * 포트 추가전 이미 등록된 포트목록인지 검증하는 함수
   * @param event
   */
  validate: async (event) => {
    let target = event.target.closest("tr").childNodes;
    let result;
    let param = {};
    for (let i = 0; i < target.length; i++) {
      if (i === target.length - 1) break;

      let paramData = target[i].childNodes[0];

      if (paramData.className === "departure" && paramData.value != "") {
        param.departureIp = paramData.value;
        continue;
      }
      if (paramData.className === "arrival" && paramData.value != "") {
        param.arrivalIp = paramData.value;
        continue;
      }
      if (paramData.className === "port" && paramData.value != "") {
        param.arrivalPort = paramData.value;
        continue;
      }
      if (paramData.className === "needed") {
        param.need = paramData.checked ? 1 : 0;
        continue;
      }
    }
    await getAPI(apiUrl + "/api/port/validate", "POST", param).then(function (
      res
    ) {
      if (res.error != undefined) {
        alertError(res);
      } else {
        result = res;
      }
    });
    return result;
  },
};

/**
 * 검증된 목록을 검증완료로 변환하는 함수
 * @param {Element} target target parent tr element
 * @param {boolean} disabled 비활성화 여부
 */
function validateNode(target, disabled) {
  //검증표시
  disabled
    ? target.classList.add("validate")
    : target.classList.remove("validate");
  // input disabled
  let childNodes = target.childNodes;
  for (let i = 0; i < childNodes.length; i++) {
    if (i != childNodes.length - 1) {
      let element = childNodes[i].firstChild;
      if (element.type === "text" || element.type === "checkbox") {
        element.disabled = disabled ? true : false;
      }
    } else {
      childNodes[i].querySelector(".fas.fa-check").style.display = disabled
        ? "none"
        : "block";
      childNodes[i].querySelector(".fas.fa-edit").style.display = disabled
        ? "block"
        : "none";
    }
  }
}

/**
 * 포트추가목록 생성함수
 * @param {string}  selector 추가 target dom 요소
 */
function addNode(selector) {
  let htmls = "";
  htmls +=
    "<tr>" +
    "<td><input type='text' class='departure' numberDotOnly></td>" +
    "<td><input type='text' class='arrival' numberDotOnly></td>" +
    "<td><input type='text' class='port' numberOnly></td>" +
    "<td><input type='text' class='description'></td>" +
    "<td><input type='checkbox' class='needed'></td>" +
    "<td>" +
    "<div class='material'>" +
    '<div class="material-tool"><a href="javascript:;" class="check">' +
    '<i class="fas fa-check" aria-hidden="true"></i></a></div>' +
    '<div class="material-tool"><a href="javascript:;" class="edit">' +
    '<i class="fas fa-edit" aria-hidden="true"></i></a></div>' +
    '<div class="material-tool"><a href="javascript:;" class="remove">' +
    '<i class="fas fa-trash-alt" aria-hidden="true"></i></a></div>' +
    "</div>" +
    "</td>" +
    "</tr>";

  let tableNode = document.createElement("tr");
  tableNode.innerHTML = htmls;
  document.querySelector(selector).prepend(tableNode);

  actionEventBind(selector + " tr:first-child");
}

/**
 * 포트노드 생성시 action 이벤트 바인딩
 * @param {string} selector selector 추가 target dom 요소
 */
function actionEventBind(selector) {
  const ipRegTest = /^([0-9]+(\.|$)){4}/;
  /**
   * 삭제이벤트 바인딩 대상 element
   * @type {Element}
   */
  let removeElement = document.querySelector(selector + " .fa-trash-alt");
  /**
   * 검증이벤트 바인딩 대상 element
   * @type {Element}
   */
  let validateElement = document.querySelector(selector + " .fa-check");
  /**
   * 수정이벤트 바인딩 대상 element
   * @type {Element}
   */
  let editElement = document.querySelector(selector + " .fa-edit");
  /**
   * numberOnly 바인딩 대상 element
   * 해당 엘리먼트는 숫자만을 입력할 수 있다.
   * @type {Element}
   */
  let numberOnlyElement = document.querySelector(
    selector + " input[numberonly]"
  );
  /**
   * numberDotOnly 바인딩 대상 element
   * 해당 엘리먼트는 숫자,.만을 입력할 수 있다.
   * @type {Element}
   */
  let numberDotOnlyElement = document.querySelectorAll(
    selector + " input[numberdotonly]"
  );

  /**
   * 삭제이벤트 바인딩
   * 해당 포트정보 입력란을 삭제한다
   */
  removeElement.addEventListener("click", function (event) {
    event.target.closest("tr").remove();
  });

  /**
   * 포트 검증 이벤트
   * 해당 포트정보가 존재하는지 검증한다.
   */
  validateElement.addEventListener("click", function (event) {
    // 중복확인 ajax
    addPortEvent.validate(event).then((result) => {
      if (result.error != undefined) {
        alertError(result);
      } else {
        if (result.port[0].count > 0) {
          alert("이미 존재하는 자원입니다");
        } else {
          validateNode(event.target.closest("tr"), true);
        }
      }
    });
  });
  /**
   * 포트 수정 이벤트
   * 작성한 포트목록을 수정한다
   */
  editElement.addEventListener("click", function (event) {
    validateNode(event.target.closest("tr"), false);
  });
  /**
   * 텍스트 입력 이벤트
   * numberOnlyElement는 숫자만 입력이 가능하다
   */
  numberOnlyElement.addEventListener("keyup", function (event) {
    let targetText = event.target.value.replace(/[^0-9]/g, "");
    event.target.value = targetText;

    if (event.target.value != "") {
      event.target.value = Number(event.target.value);
    }
  });
  /**
   * 텍스트입력 이벤트
   * numberDotOnlyElement Ip값만 입력 가능하다.
   */
  for (let i = 0; i < numberDotOnlyElement.length; i++) {
    numberDotOnlyElement[i].addEventListener("focusout", function (event) {
      let targetText = event.target.value.trim();
      if (!ipRegTest.test(targetText)) {
        event.target.value = "";
      } else {
        event.target.value = targetText;
      }
    });
  }
}
